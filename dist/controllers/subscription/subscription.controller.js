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
exports.getSubscriptionHistory = exports.checkSubscriptionStatus = exports.handleSubscriptionWebhook = exports.cancelSubscription = exports.getUserSubscriptions = exports.verifySubscription = void 0;
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
        subscriptions.forEach(sub => {
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
// Webhook handler for subscription updates
const handleSubscriptionWebhook = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { platform, event, subscriptionId, data } = req.body;
        // Verify webhook signature based on platform
        // This is a placeholder - implement proper signature verification
        const isValidWebhook = true; // TODO: Implement proper verification
        if (!isValidWebhook) {
            return (0, errorHandler_1.default)({
                message: 'Invalid webhook signature',
                statusCode: 401,
                req,
                res
            });
        }
        const subscription = yield subscription_model_1.default.findOne({
            platformSubscriptionId: subscriptionId
        });
        if (!subscription) {
            return (0, errorHandler_1.default)({
                message: 'Subscription not found',
                statusCode: 404,
                req,
                res
            });
        }
        // Handle different webhook events
        switch (event) {
            case 'subscription_renewed':
                subscription.status = 'active';
                subscription.endDate = new Date(data.newExpiryDate);
                break;
            case 'subscription_cancelled':
                subscription.status = 'cancelled';
                subscription.autoRenew = false;
                break;
            case 'subscription_expired':
                subscription.status = 'expired';
                break;
            default:
                return (0, errorHandler_1.default)({
                    message: 'Unsupported event type',
                    statusCode: 400,
                    req,
                    res
                });
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
            data: { message: 'Webhook processed successfully' },
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
exports.handleSubscriptionWebhook = handleSubscriptionWebhook;
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
        const activeSubscriptions = subscriptions.filter(sub => sub.status === 'active');
        const cancelledSubscriptions = subscriptions.filter(sub => sub.status === 'cancelled');
        const expiredSubscriptions = subscriptions.filter(sub => sub.status === 'expired');
        const statusSummary = {
            total: subscriptions.length,
            active: activeSubscriptions.length,
            cancelled: cancelledSubscriptions.length,
            expired: expiredSubscriptions.length,
            subscriptions: subscriptions.map(sub => ({
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
        const history = subscriptions.map(sub => ({
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
