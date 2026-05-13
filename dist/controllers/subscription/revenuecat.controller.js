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
// Handle RevenueCat Unified Webhooks
const handleRevenueCatWebhook = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        const { type: eventType, app_user_id, original_transaction_id, expiration_at_ms, purchased_at_ms, entitlement_ids, auto_resume_at_ms } = event;
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
                status = 'active';
                autoRenew = true;
                break;
            default:
                // For other events, maintain current status based on expiration
                status = isStillActive ? 'active' : 'expired';
                break;
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
            lastVerifiedAt: new Date()
        };
        const subscription = yield subscription_model_1.default.findOneAndUpdate({ platformSubscriptionId: original_transaction_id }, subscriptionData, { upsert: true, new: true });
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
        const { activeSubscriptions, subscriber } = yield (0, revenueCat_1.getRevenueCatUserStatus)(user.email);
        // Update all subscription statuses for this user
        const userUpdateData = {
            'subscriptions.sustainbuddyGPT': false,
            'subscriptions.contentCreator': false
        };
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
        yield user_model_1.default.findByIdAndUpdate(user._id, userUpdateData);
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
