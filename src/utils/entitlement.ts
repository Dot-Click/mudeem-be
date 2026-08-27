import mongoose from 'mongoose';
import Subscription from '../models/user/subscription.model';
import User from '../models/user/user.model';
import { ISubscription } from '../types/models/user';
import { getRevenueCatUserStatus } from './revenueCat';

export type SubscriptionType = ISubscription['type'];

export const SUBSCRIPTION_TYPES: SubscriptionType[] = [
    'sustainbuddy_gpt',
    'content_creator'
];

/**
 * How long after endDate we keep granting access when RevenueCat cannot be
 * reached. Without this a RevenueCat outage would revoke paying customers; with
 * it, the exposure from a genuinely lapsed subscription stays bounded.
 */
const RC_OUTAGE_GRACE_MS = 72 * 60 * 60 * 1000;

/**
 * Minimum gap between RevenueCat re-verifications for the same subscription, so
 * a user hammering the app does not produce one RC call per request.
 */
const REVERIFY_COOLDOWN_MS = 5 * 60 * 1000;

export interface ResolvedEntitlement {
    active: boolean;
    subscription: ISubscription | null;
}

export type ResolvedEntitlements = Record<SubscriptionType, ResolvedEntitlement>;

/**
 * A subscription grants access while it has not passed its end date.
 *
 * 'cancelled' still counts: the user turned off auto-renew but has paid through
 * the end of the current period, and both stores require that they keep access
 * until then.
 */
const isWithinPaidPeriod = (sub: ISubscription, now: number): boolean =>
    (sub.status === 'active' || sub.status === 'cancelled') &&
    !!sub.endDate &&
    sub.endDate.getTime() > now;

const shouldReverify = (sub: ISubscription | null, now: number): boolean => {
    if (!sub) return true;
    const lastVerified = sub.lastVerifiedAt?.getTime() ?? 0;
    return now - lastVerified > REVERIFY_COOLDOWN_MS;
};

/**
 * Resolves what a user is actually entitled to right now.
 *
 * Stored status alone is not trusted: it only changes when a RevenueCat webhook
 * arrives, so a single missed or failed delivery would otherwise leave a lapsed
 * subscription marked 'active' forever. When the stored record looks expired we
 * ask RevenueCat directly before taking access away, which avoids revoking a
 * user whose RENEWAL webhook simply never arrived.
 */
export const resolveEntitlements = async (
    userId: mongoose.Types.ObjectId,
    userEmail: string,
    userFlags?: { sustainbuddyGPT?: boolean; contentCreator?: boolean }
): Promise<ResolvedEntitlements> => {
    const now = Date.now();

    const subs = await Subscription.find({ user: userId }).sort({ endDate: -1 });

    const latestByType = new Map<SubscriptionType, ISubscription>();
    for (const sub of subs) {
        if (!latestByType.has(sub.type)) latestByType.set(sub.type, sub);
    }

    const result: ResolvedEntitlements = {
        sustainbuddy_gpt: { active: false, subscription: null },
        content_creator: { active: false, subscription: null }
    };

    const flagFor = (type: SubscriptionType): boolean =>
        type === 'sustainbuddy_gpt'
            ? !!userFlags?.sustainbuddyGPT
            : !!userFlags?.contentCreator;

    // Types that look lapsed locally but might still be live at RevenueCat.
    const needsReverify: SubscriptionType[] = [];

    for (const type of SUBSCRIPTION_TYPES) {
        const sub = latestByType.get(type) ?? null;

        if (sub && isWithinPaidPeriod(sub, now)) {
            result[type] = { active: true, subscription: sub };
            continue;
        }

        // Either the record has lapsed, or there is no record but a legacy
        // User flag claims access. Both need confirmation from RevenueCat
        // before we either revoke or grant.
        if (sub || flagFor(type)) {
            if (shouldReverify(sub, now)) {
                needsReverify.push(type);
            } else if (sub) {
                result[type] = { active: false, subscription: sub };
            }
        }
    }

    if (needsReverify.length === 0) {
        return result;
    }

    let rcActive: Array<{ type: SubscriptionType; expiresDate: Date | null }> = [];
    let rcReachable = true;

    try {
        const { activeSubscriptions } = await getRevenueCatUserStatus(userEmail);
        rcActive = activeSubscriptions.map((s) => ({
            type: s.type as SubscriptionType,
            expiresDate: s.expiresDate ?? null
        }));
    } catch (error) {
        rcReachable = false;
        console.warn(
            `[Entitlement] RevenueCat unreachable while re-verifying user ${userId.toString()}:`,
            (error as Error).message
        );
    }

    for (const type of needsReverify) {
        const sub = latestByType.get(type) ?? null;
        const live = rcActive.find((s) => s.type === type);

        if (live) {
            // Still subscribed — the local record was stale (missed webhook).
            const endDate = live.expiresDate ?? sub?.endDate ?? new Date(now);
            if (sub) {
                sub.status = 'active';
                sub.endDate = endDate;
                sub.lastVerifiedAt = new Date(now);
                await sub.save();
            }
            result[type] = { active: true, subscription: sub };
            await setUserFlag(userId, type, true);
            continue;
        }

        if (!rcReachable) {
            // Cannot confirm either way. Keep access inside the grace window so
            // an outage does not lock out paying users, then fail closed.
            const endMs = sub?.endDate?.getTime() ?? 0;
            const withinGrace = endMs > 0 && now - endMs < RC_OUTAGE_GRACE_MS;
            result[type] = { active: withinGrace, subscription: sub };
            continue;
        }

        // RevenueCat is reachable and reports no active entitlement: it is
        // genuinely over. Persist that so later reads are cheap.
        if (sub && sub.status !== 'expired') {
            sub.status = 'expired';
            sub.autoRenew = false;
            sub.lastVerifiedAt = new Date(now);
            await sub.save();
        }
        result[type] = { active: false, subscription: sub };
        await setUserFlag(userId, type, false);
    }

    return result;
};

const setUserFlag = async (
    userId: mongoose.Types.ObjectId,
    type: SubscriptionType,
    value: boolean
): Promise<void> => {
    const field =
        type === 'sustainbuddy_gpt'
            ? 'subscriptions.sustainbuddyGPT'
            : 'subscriptions.contentCreator';
    await User.findByIdAndUpdate(userId, { [field]: value });
};
