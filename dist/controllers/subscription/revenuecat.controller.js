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
exports.syncRevenueCatSubscription = exports.handleRevenueCatWebhook = void 0;
const errorHandler_1 = __importDefault(require("../../utils/errorHandler"));
const successHandler_1 = __importDefault(require("../../utils/successHandler"));
const subscription_model_1 = __importDefault(require("../../models/user/subscription.model"));
const user_model_1 = __importDefault(require("../../models/user/user.model"));
const subscription_config_1 = require("../../config/subscription.config");
const revenueCat_1 = require("../../utils/revenueCat");
const webhookEvent_model_1 = __importDefault(require("../../models/subscription/webhookEvent.model"));
/**
 * Removes an entitlement from the accounts a subscription was transferred away
 * from, so the same purchase cannot keep two accounts entitled at once.
 *
 * RevenueCat identifies users here by app_user_id, which for this app is the
 * account email.
 */
const revokeTransferredEntitlements = (transferredFrom, entitlementIds) => __awaiter(void 0, void 0, void 0, function* () {
    if (!Array.isArray(transferredFrom) || transferredFrom.length === 0)
        return;
    const types = new Set();
    if (Array.isArray(entitlementIds)) {
        for (const entId of entitlementIds) {
            const mapped = subscription_config_1.MAP_ENTITLEMENT_TO_TYPE[entId];
            if (mapped)
                types.add(mapped);
        }
    }
    if (types.size === 0)
        return;
    for (const previousAppUserId of transferredFrom) {
        const previousUser = yield user_model_1.default.findOne({ email: previousAppUserId });
        if (!previousUser)
            continue;
        const update = {};
        for (const type of types) {
            update[type === 'sustainbuddy_gpt'
                ? 'subscriptions.sustainbuddyGPT'
                : 'subscriptions.contentCreator'] = false;
            yield subscription_model_1.default.updateMany({ user: previousUser._id, type }, { $set: { status: 'expired', autoRenew: false, lastVerifiedAt: new Date() } });
        }
        yield user_model_1.default.findByIdAndUpdate(previousUser._id, update);
        console.log(`RevenueCat Webhook: revoked transferred entitlement(s) from user ${previousUser._id.toString()}`);
    }
});
// Handle RevenueCat Unified Webhooks
const handleRevenueCatWebhook = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { event } = req.body;
        if (!event) {
            return (0, errorHandler_1.default)({
                message: 'Missing event in payload',
                statusCode: 400,
                req,
                res
            });
        }
        // Verify Webhook Secret (if configured)
        const webhookSecret = process.env.REVENUECAT_WEBHOOK_SECRET;
        const authHeader = req.headers.authorization;
        if (webhookSecret && authHeader !== `Bearer ${webhookSecret}`) {
            console.warn('Unauthorized RevenueCat webhook attempt');
            return (0, errorHandler_1.default)({
                message: 'Unauthorized',
                statusCode: 401,
                req,
                res
            });
        }
        const { id: eventId, type: eventType, app_user_id, original_transaction_id, expiration_at_ms, purchased_at_ms, entitlement_ids, auto_resume_at_ms, event_timestamp_ms, transferred_from, transferred_to } = event;
        // TEST events exist only to prove the endpoint is reachable. Creating
        // subscription records from them would put junk in production data.
        if (eventType === 'TEST') {
            return (0, successHandler_1.default)({
                res,
                data: { message: 'Test event acknowledged' },
                statusCode: 200
            });
        }
        // Idempotency. RevenueCat retries anything it does not get a 2xx for, so
        // the same event routinely arrives more than once. The unique index makes
        // the check atomic — two concurrent deliveries cannot both win.
        if (eventId) {
            try {
                yield webhookEvent_model_1.default.create({
                    eventId,
                    provider: 'revenue_cat',
                    eventType: eventType || 'UNKNOWN'
                });
            }
            catch (dupErr) {
                if (dupErr.code === 11000) {
                    return (0, successHandler_1.default)({
                        res,
                        data: { message: 'Event already processed' },
                        statusCode: 200
                    });
                }
                throw dupErr;
            }
        }
        // TRANSFER moves entitlements between store accounts (Play account
        // change, family sharing). The receiving user is granted below via the
        // normal path; the previous holders must lose access here, otherwise two
        // accounts keep the same entitlement.
        if (eventType === 'TRANSFER') {
            yield revokeTransferredEntitlements(transferred_from, entitlement_ids);
            const target = Array.isArray(transferred_to) ? transferred_to[0] : undefined;
            if (!target) {
                return (0, successHandler_1.default)({
                    res,
                    data: { message: 'Transfer processed (no destination user)' },
                    statusCode: 200
                });
            }
        }
        if (!app_user_id) {
            return (0, successHandler_1.default)({
                res,
                data: { message: 'Ignored event without app_user_id' },
                statusCode: 200
            });
        }
        // app_user_id from RC is the user's email (set at login in the Flutter SDK)
        const user = yield user_model_1.default.findOne({ email: app_user_id });
        if (!user) {
            // User might have been deleted or doesn't exist in our DB
            return (0, successHandler_1.default)({
                res,
                data: { message: `User ${app_user_id} not found in our records` },
                statusCode: 200
            });
        }
        // Determine subscription type from entitlements
        let type = null;
        if (entitlement_ids && entitlement_ids.length > 0) {
            for (const entId of entitlement_ids) {
                if (subscription_config_1.MAP_ENTITLEMENT_TO_TYPE[entId]) {
                    type = subscription_config_1.MAP_ENTITLEMENT_TO_TYPE[entId];
                    break;
                }
            }
        }
        if (!type) {
            return (0, successHandler_1.default)({
                res,
                data: { message: 'Ignored event without matching entitlement mapping' },
                statusCode: 200
            });
        }
        // Map RevenueCat events to our internal status
        // Docs: https://www.revenuecat.com/docs/webhooks
        let status = 'active';
        let autoRenew = true;
        const isStillActive = expiration_at_ms && expiration_at_ms > Date.now();
        switch (eventType) {
            case 'INITIAL_PURCHASE':
            case 'RENEWAL':
            case 'UNCANCELLATION':
            case 'SUBSCRIPTION_RESUMED':
                status = 'active';
                autoRenew = true;
                break;
            case 'CANCELLATION':
                // Cancellation in RC means auto-renew is OFF, but it might still be active until expiration
                status = isStillActive ? 'active' : 'expired';
                autoRenew = false;
                break;
            case 'EXPIRATION':
            case 'REVOKE':
                status = 'expired';
                autoRenew = false;
                break;
            case 'BILLING_ISSUE':
                // Keep active if still within expiry window; just stop auto-renew
                status = isStillActive ? 'active' : 'expired';
                autoRenew = false;
                break;
            case 'PRODUCT_CHANGE':
            case 'SUBSCRIPTION_EXTENDED':
                status = 'active';
                autoRenew = true;
                break;
            case 'SUBSCRIPTION_PAUSED':
                // Google Play pause. Access continues to the end of the period
                // already paid for, then stops until auto_resume_at_ms.
                status = isStillActive ? 'active' : 'expired';
                autoRenew = false;
                break;
            default:
                // For other events, maintain current status based on expiration
                status = isStillActive ? 'active' : 'expired';
                break;
        }
        // Without an original_transaction_id there is nothing stable to key the
        // record on, and upserting on `undefined` would collide on the unique
        // index the moment a second such event arrived.
        if (!original_transaction_id) {
            return (0, successHandler_1.default)({
                res,
                data: { message: 'Ignored event without original_transaction_id' },
                statusCode: 200
            });
        }
        const existing = yield subscription_model_1.default.findOne({
            platformSubscriptionId: original_transaction_id
        });
        // Ordering guard. Deliveries can arrive out of order, and applying a
        // stale EXPIRATION after a fresh RENEWAL would revoke a paying user.
        const incomingTs = Number(event_timestamp_ms) || 0;
        if (existing &&
            incomingTs > 0 &&
            ((_a = existing.lastEventTimestampMs) !== null && _a !== void 0 ? _a : 0) > incomingTs) {
            return (0, successHandler_1.default)({
                res,
                data: { message: 'Ignored out-of-order event' },
                statusCode: 200
            });
        }
        const subscriptionData = {
            user: user._id,
            type,
            platform: 'revenue_cat',
            status,
            startDate: purchased_at_ms ? new Date(purchased_at_ms) : new Date(),
            endDate: expiration_at_ms ? new Date(expiration_at_ms) : new Date(),
            platformSubscriptionId: original_transaction_id,
            receiptData: event,
            autoRenew,
            lastVerifiedAt: new Date(),
            lastEventTimestampMs: incomingTs,
            autoResumeAt: auto_resume_at_ms ? new Date(auto_resume_at_ms) : null
        };
        yield subscription_model_1.default.findOneAndUpdate({ platformSubscriptionId: original_transaction_id }, subscriptionData, { upsert: true, new: true });
        // Update user's subscription status in the User model
        const updateData = {};
        const isEntitled = status === 'active';
        if (type === 'sustainbuddy_gpt') {
            updateData['subscriptions.sustainbuddyGPT'] = isEntitled;
        }
        else if (type === 'content_creator') {
            updateData['subscriptions.contentCreator'] = isEntitled;
        }
        yield user_model_1.default.findByIdAndUpdate(user._id, updateData);
        console.log(`RevenueCat Webhook: Updated User ${user.email} to ${type}:${status}`);
        return (0, successHandler_1.default)({
            res,
            data: { message: 'RevenueCat Webhook processed successfully' },
            statusCode: 200
        });
    }
    catch (error) {
        console.error('RevenueCat Webhook Error:', error);
        return (0, errorHandler_1.default)({
            message: error.message,
            statusCode: 500,
            req,
            res
        });
    }
});
exports.handleRevenueCatWebhook = handleRevenueCatWebhook;
// Manually sync subscription from RevenueCat API
const syncRevenueCatSubscription = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const user = req.user;
        if (!user) {
            return (0, errorHandler_1.default)({
                message: 'User not found',
                statusCode: 404,
                req,
                res
            });
        }
        // Use the RC SDK's originalAppUserId if the Flutter app sends it.
        // The SDK may be using an anonymous ID or alias that doesn't match the
        // user's email — this ensures we query RC with the correct identifier.
        const rcAppUserId = ((_a = req.body) === null || _a === void 0 ? void 0 : _a.rcAppUserId) || user.email;
        console.log(`[RC Sync] Querying RC for user ${user.email} using appUserId: ${rcAppUserId}`);
        const { activeSubscriptions, subscriber } = yield (0, revenueCat_1.getRevenueCatUserStatus)(rcAppUserId);
        // Safety: if RC returned no entitlements at all, skip the update entirely.
        // An empty response most likely means a project mismatch or a transient RC
        // API issue — we must not overwrite existing access with false in that case.
        // Expiration / cancellation are handled by webhooks, not by sync.
        const hasAnyEntitlement = Object.keys(subscriber.entitlements).length > 0;
        if (!hasAnyEntitlement) {
            console.warn(`[RC Sync] No entitlements returned for appUserId=${rcAppUserId} (user=${user.email}) — skipping update`);
            return (0, successHandler_1.default)({
                res,
                data: {
                    message: 'No entitlements found in RevenueCat — user flags unchanged',
                    activeSubscriptions: []
                },
                statusCode: 200
            });
        }
        // Sync only activates flags — it never clears them.
        // Deactivation is the webhook's job (EXPIRATION / CANCELLATION events).
        // Clearing flags here would destroy access whenever RC returns an
        // expired entitlement (e.g. purchase made under a different RC identity).
        const userUpdateData = {};
        console.log(`[RC Sync] Active entitlements for ${user.email}: ${activeSubscriptions.map(s => s.type).join(', ') || 'none'}`);
        for (const sub of activeSubscriptions) {
            if (sub.type === 'sustainbuddy_gpt')
                userUpdateData['subscriptions.sustainbuddyGPT'] = true;
            if (sub.type === 'content_creator')
                userUpdateData['subscriptions.contentCreator'] = true;
            // Update or create subscription record
            if (!sub.originalTransactionId) {
                console.warn(`[RC Sync] Skipping sub type=${sub.type}: original_transaction_id missing`);
                continue;
            }
            yield subscription_model_1.default.findOneAndUpdate({ platformSubscriptionId: sub.originalTransactionId }, {
                user: user._id,
                type: sub.type,
                platform: 'revenue_cat',
                status: 'active',
                startDate: sub.purchaseDate,
                endDate: sub.expiresDate,
                platformSubscriptionId: sub.originalTransactionId,
                receiptData: subscriber,
                autoRenew: true,
                lastVerifiedAt: new Date()
            }, { upsert: true });
        }
        if (Object.keys(userUpdateData).length > 0) {
            yield user_model_1.default.findByIdAndUpdate(user._id, userUpdateData);
            console.log(`[RC Sync] Updated flags for ${user.email}:`, userUpdateData);
        }
        else {
            console.warn(`[RC Sync] No active subscriptions confirmed by RC for ${user.email} — user flags unchanged`);
        }
        return (0, successHandler_1.default)({
            res,
            data: {
                message: 'Subscriptions synced with RevenueCat',
                activeSubscriptions
            },
            statusCode: 200
        });
    }
    catch (error) {
        return (0, errorHandler_1.default)({
            message: error.message,
            statusCode: 500,
            req,
            res
        });
    }
});
exports.syncRevenueCatSubscription = syncRevenueCatSubscription;
