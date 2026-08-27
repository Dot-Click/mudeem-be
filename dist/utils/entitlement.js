"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveEntitlements = exports.SUBSCRIPTION_TYPES = void 0;
const subscription_model_1 = __importDefault(require("../models/user/subscription.model"));
const user_model_1 = __importDefault(require("../models/user/user.model"));
const revenueCat_1 = require("./revenueCat");
exports.SUBSCRIPTION_TYPES = [
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
/**
 * A subscription grants access while it has not passed its end date.
 *
 * 'cancelled' still counts: the user turned off auto-renew but has paid through
 * the end of the current period, and both stores require that they keep access
 * until then.
 */
const isWithinPaidPeriod = (sub, now) => (sub.status === 'active' || sub.status === 'cancelled') &&
    !!sub.endDate &&
    sub.endDate.getTime() > now;
const shouldReverify = (sub, now) => {
    var _a, _b;
    if (!sub)
        return true;
    const lastVerified = (_b = (_a = sub.lastVerifiedAt) === null || _a === void 0 ? void 0 : _a.getTime()) !== null && _b !== void 0 ? _b : 0;
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
const resolveEntitlements = (userId, userEmail, userFlags) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f;
    const now = Date.now();
    const subs = yield subscription_model_1.default.find({ user: userId }).sort({ endDate: -1 });
    const latestByType = new Map();
    for (const sub of subs) {
        if (!latestByType.has(sub.type))
            latestByType.set(sub.type, sub);
    }
    const result = {
        sustainbuddy_gpt: { active: false, subscription: null },
        content_creator: { active: false, subscription: null }
    };
    const flagFor = (type) => type === 'sustainbuddy_gpt'
        ? !!(userFlags === null || userFlags === void 0 ? void 0 : userFlags.sustainbuddyGPT)
        : !!(userFlags === null || userFlags === void 0 ? void 0 : userFlags.contentCreator);
    // Types that look lapsed locally but might still be live at RevenueCat.
    const needsReverify = [];
    for (const type of exports.SUBSCRIPTION_TYPES) {
        const sub = (_a = latestByType.get(type)) !== null && _a !== void 0 ? _a : null;
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
            }
            else if (sub) {
                result[type] = { active: false, subscription: sub };
            }
        }
    }
    if (needsReverify.length === 0) {
        return result;
    }
    let rcActive = [];
    let rcReachable = true;
    try {
        const { activeSubscriptions } = yield (0, revenueCat_1.getRevenueCatUserStatus)(userEmail);
        rcActive = activeSubscriptions.map((s) => {
            var _a;
            return ({
                type: s.type,
                expiresDate: (_a = s.expiresDate) !== null && _a !== void 0 ? _a : null
            });
        });
    }
    catch (error) {
        rcReachable = false;
        console.warn(`[Entitlement] RevenueCat unreachable while re-verifying user ${userId.toString()}:`, error.message);
    }
    for (const type of needsReverify) {
        const sub = (_b = latestByType.get(type)) !== null && _b !== void 0 ? _b : null;
        const live = rcActive.find((s) => s.type === type);
        if (live) {
            // Still subscribed — the local record was stale (missed webhook).
            const endDate = (_d = (_c = live.expiresDate) !== null && _c !== void 0 ? _c : sub === null || sub === void 0 ? void 0 : sub.endDate) !== null && _d !== void 0 ? _d : new Date(now);
            if (sub) {
                sub.status = 'active';
                sub.endDate = endDate;
                sub.lastVerifiedAt = new Date(now);
                yield sub.save();
            }
            result[type] = { active: true, subscription: sub };
            yield setUserFlag(userId, type, true);
            continue;
        }
        if (!rcReachable) {
            // Cannot confirm either way. Keep access inside the grace window so
            // an outage does not lock out paying users, then fail closed.
            const endMs = (_f = (_e = sub === null || sub === void 0 ? void 0 : sub.endDate) === null || _e === void 0 ? void 0 : _e.getTime()) !== null && _f !== void 0 ? _f : 0;
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
            yield sub.save();
        }
        result[type] = { active: false, subscription: sub };
        yield setUserFlag(userId, type, false);
    }
    return result;
});
exports.resolveEntitlements = resolveEntitlements;
const setUserFlag = (userId, type, value) => __awaiter(void 0, void 0, void 0, function* () {
    const field = type === 'sustainbuddy_gpt'
        ? 'subscriptions.sustainbuddyGPT'
        : 'subscriptions.contentCreator';
    yield user_model_1.default.findByIdAndUpdate(userId, { [field]: value });
});
