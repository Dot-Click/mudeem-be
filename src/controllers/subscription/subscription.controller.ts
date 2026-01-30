import { RequestHandler } from 'express';
import ErrorHandler from '../../utils/errorHandler';
import SuccessHandler from '../../utils/successHandler';
import Subscription from '../../models/user/subscription.model';
import User from '../../models/user/user.model';
import { verifyGooglePlaySubscription } from '../../utils/googlePlay';
import { verifyAppleSubscription } from '../../utils/appleStore';
import { ISubscription } from '../../types/models/user';

interface SubscriptionStatus {
    active: boolean;
    subscription: ISubscription | null;
}

interface SubscriptionStatusResponse {
    sustainbuddyGPT: SubscriptionStatus;
    contentCreator: SubscriptionStatus;
}

// Verify and create/update subscription
const verifySubscription: RequestHandler = async (req, res) => {
    try {
        const { platform, receipt, type } = req.body;
        const user = req.user;

        if (!user) {
            return ErrorHandler({
                message: 'User not found',
                statusCode: 404,
                req,
                res
            });
        }

        // Validate subscription type
        if (!['sustainbuddy_gpt', 'content_creator'].includes(type)) {
            return ErrorHandler({
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
            verificationResult = await verifyGooglePlaySubscription(receipt);
        } else if (platform === 'apple_store') {
            verificationResult = await verifyAppleSubscription(receipt);
        } else {
            return ErrorHandler({
                message: 'Invalid platform',
                statusCode: 400,
                req,
                res
            });
        }

        if (!verificationResult.isValid) {
            return ErrorHandler({
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

        const subscription = await Subscription.findOneAndUpdate(
            { platformSubscriptionId: verificationResult.subscriptionId },
            subscriptionData,
            { upsert: true, new: true }
        );

        // Update user's subscription status based on type
        const updateData: any = {};
        if (type === 'sustainbuddy_gpt') {
            updateData['subscriptions.sustainbuddyGPT'] = verificationResult.status === 'active';
        } else if (type === 'content_creator') {
            updateData['subscriptions.contentCreator'] = verificationResult.status === 'active';
        }

        await User.findByIdAndUpdate(user._id, updateData);

        return SuccessHandler({
            res,
            data: subscription,
            statusCode: 200
        });
    } catch (error) {
        return ErrorHandler({
            message: (error as Error).message,
            statusCode: 500,
            req,
            res
        });
    }
};

// Get user's active subscriptions
const getUserSubscriptions: RequestHandler = async (req, res) => {
    try {
        const user = req.user;

        if (!user) {
            return ErrorHandler({
                message: 'User not found',
                statusCode: 404,
                req,
                res
            });
        }

        // Get all subscriptions for the user
        const subscriptions = await Subscription.find({
            user: user._id
        }).sort({ createdAt: -1 });

        // Group subscriptions by type
        const subscriptionStatus: SubscriptionStatusResponse = {
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
        subscriptions.forEach((sub: ISubscription) => {
            if (sub.type === 'sustainbuddy_gpt' && sub.status === 'active') {
                subscriptionStatus.sustainbuddyGPT.active = true;
                subscriptionStatus.sustainbuddyGPT.subscription = sub.toObject();
            } else if (sub.type === 'content_creator' && sub.status === 'active') {
                subscriptionStatus.contentCreator.active = true;
                subscriptionStatus.contentCreator.subscription = sub.toObject();
            }
        });

        return SuccessHandler({
            res,
            data: subscriptionStatus,
            statusCode: 200
        });
    } catch (error) {
        return ErrorHandler({
            message: (error as Error).message,
            statusCode: 500,
            req,
            res
        });
    }
};

// Cancel subscription
const cancelSubscription: RequestHandler = async (req, res) => {
    try {
        const { subscriptionId } = req.params;
        const user = req.user;

        if (!user) {
            return ErrorHandler({
                message: 'User not found',
                statusCode: 404,
                req,
                res
            });
        }

        const subscription = await Subscription.findOne({
            _id: subscriptionId,
            user: user._id
        });

        if (!subscription) {
            return ErrorHandler({
                message: 'Subscription not found',
                statusCode: 404,
                req,
                res
            });
        }

        subscription.status = 'cancelled';
        subscription.autoRenew = false;
        await subscription.save();

        // Update user's subscription status based on type
        const updateData: any = {};
        if (subscription.type === 'sustainbuddy_gpt') {
            updateData['subscriptions.sustainbuddyGPT'] = false;
        } else if (subscription.type === 'content_creator') {
            updateData['subscriptions.contentCreator'] = false;
        }

        await User.findByIdAndUpdate(user._id, updateData);

        return SuccessHandler({
            res,
            data: subscription,
            statusCode: 200
        });
    } catch (error) {
        return ErrorHandler({
            message: (error as Error).message,
            statusCode: 500,
            req,
            res
        });
    }
};

// Webhook handler for subscription updates
const handleSubscriptionWebhook: RequestHandler = async (req, res) => {
    try {
        const { platform, event, subscriptionId, data } = req.body;

        // Verify webhook signature based on platform
        // This is a placeholder - implement proper signature verification
        const isValidWebhook = true; // TODO: Implement proper verification

        if (!isValidWebhook) {
            return ErrorHandler({
                message: 'Invalid webhook signature',
                statusCode: 401,
                req,
                res
            });
        }

        const subscription = await Subscription.findOne({
            platformSubscriptionId: subscriptionId
        });

        if (!subscription) {
            return ErrorHandler({
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
                return ErrorHandler({
                    message: 'Unsupported event type',
                    statusCode: 400,
                    req,
                    res
                });
        }

        await subscription.save();

        // Update user's subscription status based on type
        const updateData: any = {};
        const isActive = subscription.status === 'active';

        if (subscription.type === 'sustainbuddy_gpt') {
            updateData['subscriptions.sustainbuddyGPT'] = isActive;
        } else if (subscription.type === 'content_creator') {
            updateData['subscriptions.contentCreator'] = isActive;
        }

        await User.findByIdAndUpdate(subscription.user, updateData);

        return SuccessHandler({
            res,
            data: { message: 'Webhook processed successfully' },
            statusCode: 200
        });
    } catch (error) {
        return ErrorHandler({
            message: (error as Error).message,
            statusCode: 500,
            req,
            res
        });
    }
};

// Check subscription status for specific type
const checkSubscriptionStatus: RequestHandler = async (req, res) => {
    try {
        const { type } = req.query;
        const user = req.user;

        if (!user) {
            return ErrorHandler({
                message: 'User not found',
                statusCode: 404,
                req,
                res
            });
        }

        let query: any = { user: user._id };

        if (type && type !== 'all') {
            query.type = type;
        }

        const subscriptions = await Subscription.find(query)
            .sort({ createdAt: -1 })
            .limit(10);

        const activeSubscriptions = subscriptions.filter((sub: ISubscription) => sub.status === 'active');
        const cancelledSubscriptions = subscriptions.filter((sub: ISubscription) => sub.status === 'cancelled');
        const expiredSubscriptions = subscriptions.filter((sub: ISubscription) => sub.status === 'expired');

        const statusSummary = {
            total: subscriptions.length,
            active: activeSubscriptions.length,
            cancelled: cancelledSubscriptions.length,
            expired: expiredSubscriptions.length,
            subscriptions: subscriptions.map((sub: ISubscription) => ({
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

        return SuccessHandler({
            res,
            data: statusSummary,
            statusCode: 200
        });
    } catch (error) {
        return ErrorHandler({
            message: (error as Error).message,
            statusCode: 500,
            req,
            res
        });
    }
};

// Get subscription history
const getSubscriptionHistory: RequestHandler = async (req, res) => {
    try {
        const user = req.user;

        if (!user) {
            return ErrorHandler({
                message: 'User not found',
                statusCode: 404,
                req,
                res
            });
        }

        const subscriptions = await Subscription.find({ user: user._id })
            .sort({ createdAt: -1 })
            .populate('user', 'name email');

        const history = subscriptions.map((sub: ISubscription) => ({
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

        return SuccessHandler({
            res,
            data: {
                total: history.length,
                history
            },
            statusCode: 200
        });
    } catch (error) {
        return ErrorHandler({
            message: (error as Error).message,
            statusCode: 500,
            req,
            res
        });
    }
};

export {
    verifySubscription,
    getUserSubscriptions,
    cancelSubscription,
    handleSubscriptionWebhook,
    checkSubscriptionStatus,
    getSubscriptionHistory
};