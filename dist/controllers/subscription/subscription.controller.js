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
exports.getSubscriptionHistory = exports.checkSubscriptionStatus = exports.handleSubscriptionWebhookGoogle = exports.handleSubscriptionWebhookApple = exports.cancelSubscription = exports.getUserSubscriptions = exports.verifySubscription = void 0;
const errorHandler_1 = __importDefault(require("../../utils/errorHandler"));
const successHandler_1 = __importDefault(require("../../utils/successHandler"));
const subscription_model_1 = __importDefault(require("../../models/user/subscription.model"));
const user_model_1 = __importDefault(require("../../models/user/user.model"));
const googlePlay_1 = require("../../utils/googlePlay");
const appleStore_1 = require("../../utils/appleStore");
// Verify and create/update subscription
const verifySubscription = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { platform, receipt, type } = req.body;
        const user = req.user;
        if (!user) {
            return (0, errorHandler_1.default)({
                message: 'User not found',
                statusCode: 404,
                req,
                res
            });
        }
        // Validate subscription type
        if (!['sustainbuddy_gpt', 'content_creator'].includes(type)) {
            return (0, errorHandler_1.default)({
                message: 'Invalid subscription type',
                statusCode: 400,
                req,
                res
            });
        }
        let verificationResult;
        let subscriptionData;
        // Verify subscription based on platform
        if (platform === 'google_play') {
            verificationResult = yield (0, googlePlay_1.verifyGooglePlaySubscription)(receipt);
        }
        else if (platform === 'apple_store') {
            verificationResult = yield (0, appleStore_1.verifyAppleSubscription)(receipt);
        }
        else {
            return (0, errorHandler_1.default)({
                message: 'Invalid platform',
                statusCode: 400,
                req,
                res
            });
        }
        if (!verificationResult.isValid) {
            return (0, errorHandler_1.default)({
                message: 'Invalid subscription receipt',
                statusCode: 400,
                req,
                res
            });
        }
        // Create or update subscription
        subscriptionData = {
            user: user._id,
            type,
            platform,
            status: verificationResult.status,
            startDate: verificationResult.startDate,
            endDate: verificationResult.endDate,
            platformSubscriptionId: verificationResult.subscriptionId,
            receiptData: receipt,
            autoRenew: verificationResult.autoRenew,
            lastVerifiedAt: new Date()
        };
        const subscription = yield subscription_model_1.default.findOneAndUpdate({ platformSubscriptionId: verificationResult.subscriptionId }, subscriptionData, { upsert: true, new: true });
        // Update user's subscription status based on type
        const updateData = {};
        if (type === 'sustainbuddy_gpt') {
            updateData['subscriptions.sustainbuddyGPT'] = verificationResult.status === 'active';
        }
        else if (type === 'content_creator') {
            updateData['subscriptions.contentCreator'] = verificationResult.status === 'active';
        }
        yield user_model_1.default.findByIdAndUpdate(user._id, updateData);
        return (0, successHandler_1.default)({
            res,
            data: subscription,
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
exports.verifySubscription = verifySubscription;
// Get user's active subscriptions
const getUserSubscriptions = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        // Get all subscriptions for the user
        const subscriptions = yield subscription_model_1.default.find({
            user: user._id
        }).sort({ createdAt: -1 });
        // Group subscriptions by type
        const subscriptionStatus = {
            sustainbuddyGPT: {
                active: false,
                subscription: null
            },
            contentCreator: {
                active: false,
                subscription: null
            }
        };
        // Update status for each subscription type
        subscriptions.forEach((sub) => {
            if (sub.type === 'sustainbuddy_gpt' && sub.status === 'active') {
                subscriptionStatus.sustainbuddyGPT.active = true;
                subscriptionStatus.sustainbuddyGPT.subscription = sub.toObject();
            }
            else if (sub.type === 'content_creator' && sub.status === 'active') {
                subscriptionStatus.contentCreator.active = true;
                subscriptionStatus.contentCreator.subscription = sub.toObject();
            }
        });
        return (0, successHandler_1.default)({
            res,
            data: subscriptionStatus,
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
exports.getUserSubscriptions = getUserSubscriptions;
// Cancel subscription
const cancelSubscription = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { subscriptionId } = req.params;
        const user = req.user;
        if (!user) {
            return (0, errorHandler_1.default)({
                message: 'User not found',
                statusCode: 404,
                req,
                res
            });
        }
        const subscription = yield subscription_model_1.default.findOne({
            _id: subscriptionId,
            user: user._id
        });
        if (!subscription) {
            return (0, errorHandler_1.default)({
                message: 'Subscription not found',
                statusCode: 404,
                req,
                res
            });
        }
        subscription.status = 'cancelled';
        subscription.autoRenew = false;
        yield subscription.save();
        // Update user's subscription status based on type
        const updateData = {};
        if (subscription.type === 'sustainbuddy_gpt') {
            updateData['subscriptions.sustainbuddyGPT'] = false;
        }
        else if (subscription.type === 'content_creator') {
            updateData['subscriptions.contentCreator'] = false;
        }
        yield user_model_1.default.findByIdAndUpdate(user._id, updateData);
        return (0, successHandler_1.default)({
            res,
            data: subscription,
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
exports.cancelSubscription = cancelSubscription;
// Webhook handler for Apple App Store Server Notifications V2
const handleSubscriptionWebhookApple = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { signedPayload } = req.body;
        if (!signedPayload) {
            return (0, errorHandler_1.default)({
                message: 'Missing signedPayload',
                statusCode: 400,
                req,
                res
            });
        }
        // Decode JWS payload (header.payload.signature)
        const parts = signedPayload.split('.');
        if (parts.length !== 3) {
            return (0, errorHandler_1.default)({
                message: 'Invalid JWS format',
                statusCode: 400,
                req,
                res
            });
        }
        const payloadBuffer = Buffer.from(parts[1], 'base64');
        const payload = JSON.parse(payloadBuffer.toString('utf-8'));
        // For production, you MUST verify the signature of the JWS using Apple's public keys.
        // This implementation trusts the decoded payload as-is.
        const notificationType = payload.notificationType;
        const signedTransactionInfo = (_a = payload.data) === null || _a === void 0 ? void 0 : _a.signedTransactionInfo;
        let transactionInfo = {};
        if (signedTransactionInfo) {
            const txParts = signedTransactionInfo.split('.');
            if (txParts.length === 3) {
                transactionInfo = JSON.parse(Buffer.from(txParts[1], 'base64').toString('utf-8'));
            }
        }
        const subscriptionId = transactionInfo.originalTransactionId || transactionInfo.transactionId;
        if (!subscriptionId) {
            return (0, successHandler_1.default)({
                res,
                data: { message: 'Ignored webhook without transaction info' },
                statusCode: 200
            });
        }
        const subscription = yield subscription_model_1.default.findOne({
            platformSubscriptionId: subscriptionId,
            platform: 'apple_store'
        });
        if (!subscription) {
            // It's possible to receive notifications before our backend is aware of the purchase.
            return (0, successHandler_1.default)({
                res,
                data: { message: 'Subscription not found in DB' },
                statusCode: 200
            });
        }
        // Handle different Apple webhook events
        const activeTypes = ['SUBSCRIBED', 'DID_RENEW', 'TEST'];
        const expiredTypes = ['EXPIRED', 'DID_FAIL_TO_RENEW', 'REVOKED'];
        if (activeTypes.includes(notificationType)) {
            subscription.status = 'active';
            if (transactionInfo.expiresDate) {
                subscription.endDate = new Date(transactionInfo.expiresDate);
            }
            subscription.autoRenew = true;
        }
        else if (expiredTypes.includes(notificationType)) {
            subscription.status = 'expired';
            subscription.autoRenew = false;
        }
        else if (notificationType === 'DID_CHANGE_RENEWAL_STATUS') {
            subscription.autoRenew = payload.subtype === 'AUTO_RENEW_ENABLED';
        }
        yield subscription.save();
        // Update user's subscription status based on type
        const updateData = {};
        const isActive = subscription.status === 'active';
        if (subscription.type === 'sustainbuddy_gpt') {
            updateData['subscriptions.sustainbuddyGPT'] = isActive;
        }
        else if (subscription.type === 'content_creator') {
            updateData['subscriptions.contentCreator'] = isActive;
        }
        yield user_model_1.default.findByIdAndUpdate(subscription.user, updateData);
        return (0, successHandler_1.default)({
            res,
            data: { message: 'Apple Webhook processed successfully' },
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
exports.handleSubscriptionWebhookApple = handleSubscriptionWebhookApple;
// Webhook handler for Google Play Real-Time Developer Notifications
const handleSubscriptionWebhookGoogle = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { message } = req.body;
        if (!message || !message.data) {
            return (0, errorHandler_1.default)({
                message: 'Invalid Google Pub/Sub message',
                statusCode: 400,
                req,
                res
            });
        }
        // Decode Base64 data from Google Pub/Sub
        const decodedData = Buffer.from(message.data, 'base64').toString('utf-8');
        const notification = JSON.parse(decodedData);
        if (!notification.subscriptionNotification) {
            // Not a subscription notification (e.g. test notification)
            return (0, successHandler_1.default)({
                res,
                data: { message: 'Ignored non-subscription notification' },
                statusCode: 200
            });
        }
        const subNotification = notification.subscriptionNotification;
        const subscriptionId = subNotification.purchaseToken;
        const notificationType = subNotification.notificationType;
        const subscription = yield subscription_model_1.default.findOne({
            platformSubscriptionId: subscriptionId,
            platform: 'google_play'
        });
        if (!subscription) {
            return (0, successHandler_1.default)({
                res,
                data: { message: 'Subscription not found in DB' },
                statusCode: 200
            });
        }
        // Notification types: https://developer.android.com/google/play/billing/rtdn-reference#sub
        // 1: RECOVERED, 2: RENEWED, 3: CANCELED, 4: PURCHASED, 5: ACCOUNT_HOLD, 6: GRACE_PERIOD
        // 7: RESTARTED, 9: DEFERRED, 12: REVOKED, 13: EXPIRED
        switch (notificationType) {
            case 1: // RECOVERED
            case 2: // RENEWED
            case 4: // PURCHASED
            case 7: // RESTARTED
                subscription.status = 'active';
                subscription.autoRenew = true;
                break;
            case 3: // CANCELED
                subscription.autoRenew = false;
                // Note: It might still be active until the end of the billing period
                break;
            case 5: // ACCOUNT_HOLD
            case 12: // REVOKED
            case 13: // EXPIRED
                subscription.status = 'expired';
                subscription.autoRenew = false;
                break;
            default:
                // Ignore other notifications without changing state
                break;
        }
        yield subscription.save();
        // Update user's subscription status based on type
        const updateData = {};
        const isActive = subscription.status === 'active';
        if (subscription.type === 'sustainbuddy_gpt') {
            updateData['subscriptions.sustainbuddyGPT'] = isActive;
        }
        else if (subscription.type === 'content_creator') {
            updateData['subscriptions.contentCreator'] = isActive;
        }
        yield user_model_1.default.findByIdAndUpdate(subscription.user, updateData);
        return (0, successHandler_1.default)({
            res,
            data: { message: 'Google Webhook processed successfully' },
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
exports.handleSubscriptionWebhookGoogle = handleSubscriptionWebhookGoogle;
// Check subscription status for specific type
const checkSubscriptionStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { type } = req.query;
        const user = req.user;
        if (!user) {
            return (0, errorHandler_1.default)({
                message: 'User not found',
                statusCode: 404,
                req,
                res
            });
        }
        let query = { user: user._id };
        if (type && type !== 'all') {
            query.type = type;
        }
        const subscriptions = yield subscription_model_1.default.find(query)
            .sort({ createdAt: -1 })
            .limit(10);
        const activeSubscriptions = subscriptions.filter((sub) => sub.status === 'active');
        const cancelledSubscriptions = subscriptions.filter((sub) => sub.status === 'cancelled');
        const expiredSubscriptions = subscriptions.filter((sub) => sub.status === 'expired');
        const statusSummary = {
            total: subscriptions.length,
            active: activeSubscriptions.length,
            cancelled: cancelledSubscriptions.length,
            expired: expiredSubscriptions.length,
            subscriptions: subscriptions.map((sub) => ({
                id: sub._id,
                type: sub.type,
                platform: sub.platform,
                status: sub.status,
                startDate: sub.startDate,
                endDate: sub.endDate,
                autoRenew: sub.autoRenew,
                lastVerifiedAt: sub.lastVerifiedAt
            }))
        };
        return (0, successHandler_1.default)({
            res,
            data: statusSummary,
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
exports.checkSubscriptionStatus = checkSubscriptionStatus;
// Get subscription history
const getSubscriptionHistory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        const subscriptions = yield subscription_model_1.default.find({ user: user._id })
            .sort({ createdAt: -1 })
            .populate('user', 'name email');
        const history = subscriptions.map((sub) => ({
            id: sub._id,
            type: sub.type,
            platform: sub.platform,
            status: sub.status,
            startDate: sub.startDate,
            endDate: sub.endDate,
            autoRenew: sub.autoRenew,
            lastVerifiedAt: sub.lastVerifiedAt,
            createdAt: sub.createdAt,
            updatedAt: sub.updatedAt
        }));
        return (0, successHandler_1.default)({
            res,
            data: {
                total: history.length,
                history
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
exports.getSubscriptionHistory = getSubscriptionHistory;
