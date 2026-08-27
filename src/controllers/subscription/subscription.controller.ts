import { RequestHandler } from 'express';
import ErrorHandler from '../../utils/errorHandler';
import SuccessHandler from '../../utils/successHandler';
import Subscription from '../../models/user/subscription.model';
import User from '../../models/user/user.model';
import { verifyGooglePlaySubscription } from '../../utils/googlePlay';
import { verifyAppleSubscription } from '../../utils/appleStore';
import { buildRevenueCatSubscriptionId, getRevenueCatUserStatus } from '../../utils/revenueCat';
import { resolveEntitlements } from '../../utils/entitlement';
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
        const { platform, type } = req.body;
        const receipt = typeof req.body.receipt === 'string' ? req.body.receipt : undefined;
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
        } else if (platform === 'revenue_cat') {
            const { activeSubscriptions } = await getRevenueCatUserStatus(user.email);
            const activeSub = activeSubscriptions.find(s => s.type === type);
            const revenueCatSubscriptionId = buildRevenueCatSubscriptionId(user._id.toString(), type);

            verificationResult = {
                isValid: !!activeSub,
                status: activeSub ? 'active' : 'expired',
                startDate: activeSub?.purchaseDate || new Date(),
                endDate: activeSub?.expiresDate || new Date(),
                subscriptionId: revenueCatSubscriptionId,
                autoRenew: !!activeSub
            };
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

        if (platform === 'revenue_cat' && !verificationResult.subscriptionId) {
            console.warn(`[RC Verify] original_transaction_id missing for user ${user._id}, type ${type}`);
            return ErrorHandler({
                message: 'Missing original_transaction_id from RevenueCat',
                statusCode: 502,
                req,
                res
            });
        }

        // Create or update subscription
        const receiptData = platform === 'revenue_cat'
            ? {
                source: 'revenue_cat_api',
                appUserId: user._id.toString(),
                type,
                entitlement: verificationResult.isValid ? {
                    startDate: verificationResult.startDate,
                    endDate: verificationResult.endDate,
                    platformSubscriptionId: verificationResult.subscriptionId
                } : null
            }
            : {
                receipt
            };

        const subscriptionLookup = platform === 'revenue_cat'
            ? { user: user._id, type, platform }
            : { platformSubscriptionId: verificationResult.subscriptionId };

        subscriptionData = {
            user: user._id,
            type,
            platform,
            status: verificationResult.status,
            startDate: verificationResult.startDate,
            endDate: verificationResult.endDate,
            platformSubscriptionId: verificationResult.subscriptionId,
            receiptData,
            autoRenew: verificationResult.autoRenew,
            lastVerifiedAt: new Date()
        };

        const subscription = await Subscription.findOneAndUpdate(
            subscriptionLookup,
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

        // Entitlement is resolved against the subscription's end date, and
        // re-checked with RevenueCat when the stored record looks lapsed.
        // Reading `status` alone would keep access alive forever whenever a
        // webhook was missed, and would also drop access the moment a user
        // turned off auto-renew despite having paid for the rest of the period.
        const entitlements = await resolveEntitlements(
            user._id,
            user.email,
            user.subscriptions
        );

        const subscriptionStatus: SubscriptionStatusResponse = {
            sustainbuddyGPT: {
                active: entitlements.sustainbuddy_gpt.active,
                subscription: entitlements.sustainbuddy_gpt.subscription
                    ? (entitlements.sustainbuddy_gpt.subscription.toObject() as ISubscription)
                    : null
            },
            contentCreator: {
                active: entitlements.content_creator.active,
                subscription: entitlements.content_creator.subscription
                    ? (entitlements.content_creator.subscription.toObject() as ISubscription)
                    : null
            }
        };

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

        // A store subscription cannot be cancelled server-side. Google and Apple
        // own the billing agreement, so this endpoint used to do two harmful
        // things at once: it left the user being charged while revoking the
        // access they had already paid for, and the next RENEWAL webhook simply
        // flipped the record back to 'active'.
        //
        // Cancellation now happens in the store's own UI, which the app deep
        // links to. This endpoint is kept only to return a clear instruction to
        // any client still calling it.
        return ErrorHandler({
            message:
                'Subscriptions must be cancelled from the App Store or Google Play. Open Manage Subscription in the app to continue.',
            statusCode: 400,
            code: 'CANCEL_VIA_STORE',
            req,
            res
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

// Webhook handler for Apple App Store Server Notifications V2
const handleSubscriptionWebhookApple: RequestHandler = async (req, res) => {
    try {
        const { signedPayload } = req.body;

        if (!signedPayload) {
            return ErrorHandler({
                message: 'Missing signedPayload',
                statusCode: 400,
                req,
                res
            });
        }

        // Decode JWS payload (header.payload.signature)
        const parts = signedPayload.split('.');
        if (parts.length !== 3) {
            return ErrorHandler({
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
        const signedTransactionInfo = payload.data?.signedTransactionInfo;

        let transactionInfo: any = {};
        if (signedTransactionInfo) {
            const txParts = signedTransactionInfo.split('.');
            if (txParts.length === 3) {
                transactionInfo = JSON.parse(Buffer.from(txParts[1], 'base64').toString('utf-8'));
            }
        }

        const subscriptionId = transactionInfo.originalTransactionId || transactionInfo.transactionId;

        if (!subscriptionId) {
            return SuccessHandler({
                res,
                data: { message: 'Ignored webhook without transaction info' },
                statusCode: 200
            });
        }

        const subscription = await Subscription.findOne({
            platformSubscriptionId: subscriptionId,
            platform: 'apple_store'
        });

        if (!subscription) {
            // It's possible to receive notifications before our backend is aware of the purchase.
            return SuccessHandler({
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
        } else if (expiredTypes.includes(notificationType)) {
            subscription.status = 'expired';
            subscription.autoRenew = false;
        } else if (notificationType === 'DID_CHANGE_RENEWAL_STATUS') {
            subscription.autoRenew = payload.subtype === 'AUTO_RENEW_ENABLED';
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
            data: { message: 'Apple Webhook processed successfully' },
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

// Webhook handler for Google Play Real-Time Developer Notifications
const handleSubscriptionWebhookGoogle: RequestHandler = async (req, res) => {
    try {
        const { message } = req.body;

        if (!message || !message.data) {
            return ErrorHandler({
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
            return SuccessHandler({
                res,
                data: { message: 'Ignored non-subscription notification' },
                statusCode: 200
            });
        }

        const subNotification = notification.subscriptionNotification;
        const subscriptionId = subNotification.purchaseToken;
        const notificationType = subNotification.notificationType;

        const subscription = await Subscription.findOne({
            platformSubscriptionId: subscriptionId,
            platform: 'google_play'
        });

        if (!subscription) {
            return SuccessHandler({
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
            data: { message: 'Google Webhook processed successfully' },
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
    handleSubscriptionWebhookApple,
    handleSubscriptionWebhookGoogle,
    checkSubscriptionStatus,
    getSubscriptionHistory
};
