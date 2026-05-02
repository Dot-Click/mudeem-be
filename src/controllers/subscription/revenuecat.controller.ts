import { RequestHandler } from 'express';
import ErrorHandler from '../../utils/errorHandler';
import SuccessHandler from '../../utils/successHandler';
import Subscription from '../../models/user/subscription.model';
import User from '../../models/user/user.model';
import { MAP_ENTITLEMENT_TO_TYPE } from '../../config/subscription.config';
import { getRevenueCatUserStatus } from '../../utils/revenueCat';

// Handle RevenueCat Unified Webhooks
const handleRevenueCatWebhook: RequestHandler = async (req, res) => {
    try {
        const { event } = req.body;
        
        if (!event) {
            return ErrorHandler({
                message: 'Missing event in payload',
                statusCode: 400,
                req,
                res
            });
        }

        const {
            event_type,
            app_user_id,
            original_transaction_id,
            expiration_at_ms,
            purchased_at_ms,
            entitlement_ids,
            auto_resume_at_ms
        } = event;

        if (!app_user_id) {
             return SuccessHandler({
                res,
                data: { message: 'Ignored event without app_user_id' },
                statusCode: 200
            });
        }

        // Find the user
        const user = await User.findById(app_user_id);
        if (!user) {
            // User might have been deleted or doesn't exist in our DB
            return SuccessHandler({
                res,
                data: { message: `User ${app_user_id} not found in our records` },
                statusCode: 200
            });
        }

        // Determine subscription type from entitlements
        let type: 'sustainbuddy_gpt' | 'content_creator' | null = null;
        if (entitlement_ids && entitlement_ids.length > 0) {
            for (const entId of entitlement_ids) {
                if (MAP_ENTITLEMENT_TO_TYPE[entId]) {
                    type = MAP_ENTITLEMENT_TO_TYPE[entId];
                    break;
                }
            }
        }

        if (!type) {
             return SuccessHandler({
                res,
                data: { message: 'Ignored event without matching entitlement mapping' },
                statusCode: 200
            });
        }

        // Map RevenueCat events to our internal status
        // Events: INITIAL_PURCHASE, RENEWAL, CANCELLATION, EXPIRATION, BILLING_ISSUE, RESTORE, etc.
        let status: 'active' | 'cancelled' | 'expired' | 'pending' = 'active';
        
        if (['EXPIRATION', 'BILLING_ISSUE', 'REVOKE'].includes(event_type)) {
            status = 'expired';
        } else if (event_type === 'CANCELLATION') {
            // Note: Cancellation in RevenueCat often means auto-renew was turned off, 
            // but the subscription might still be active until expiration_at_ms.
            // We'll check if the expiration date is in the future.
            const isStillActive = expiration_at_ms && expiration_at_ms > Date.now();
            status = isStillActive ? 'active' : 'expired';
        }

        const subscriptionData = {
            user: user._id,
            type,
            platform: 'revenue_cat',
            status,
            startDate: new Date(purchased_at_ms),
            endDate: new Date(expiration_at_ms),
            platformSubscriptionId: original_transaction_id,
            receiptData: event,
            autoRenew: !['CANCELLATION', 'EXPIRATION', 'BILLING_ISSUE'].includes(event_type),
            lastVerifiedAt: new Date()
        };

        const subscription = await Subscription.findOneAndUpdate(
            { platformSubscriptionId: original_transaction_id },
            subscriptionData,
            { upsert: true, new: true }
        );

        // Update user's subscription status in the User model
        const updateData: any = {};
        const isActive = status === 'active';

        if (type === 'sustainbuddy_gpt') {
            updateData['subscriptions.sustainbuddyGPT'] = isActive;
        } else if (type === 'content_creator') {
            updateData['subscriptions.contentCreator'] = isActive;
        }

        await User.findByIdAndUpdate(user._id, updateData);

        return SuccessHandler({
            res,
            data: { message: 'RevenueCat Webhook processed successfully' },
            statusCode: 200
        });
    } catch (error) {
        console.error('RevenueCat Webhook Error:', error);
        return ErrorHandler({
            message: (error as Error).message,
            statusCode: 500,
            req,
            res
        });
    }
};

// Manually sync subscription from RevenueCat API
const syncRevenueCatSubscription: RequestHandler = async (req, res) => {
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

        const { activeSubscriptions, subscriber } = await getRevenueCatUserStatus(user._id.toString());

        // Update all subscription statuses for this user
        const userUpdateData: any = {
            'subscriptions.sustainbuddyGPT': false,
            'subscriptions.contentCreator': false
        };

        for (const sub of activeSubscriptions) {
            if (sub.type === 'sustainbuddy_gpt') userUpdateData['subscriptions.sustainbuddyGPT'] = true;
            if (sub.type === 'content_creator') userUpdateData['subscriptions.contentCreator'] = true;

            // Update or create subscription record
            await Subscription.findOneAndUpdate(
                { user: user._id, type: sub.type, platform: 'revenue_cat' },
                {
                    status: 'active',
                    startDate: sub.purchaseDate,
                    endDate: sub.expiresDate,
                    platformSubscriptionId: subscriber.subscriptions[sub.productId]?.original_purchase_date || 'rc_' + Date.now(),
                    receiptData: subscriber,
                    autoRenew: true, // Simplified
                    lastVerifiedAt: new Date()
                },
                { upsert: true }
            );
        }

        await User.findByIdAndUpdate(user._id, userUpdateData);

        return SuccessHandler({
            res,
            data: { 
                message: 'Subscriptions synced with RevenueCat',
                activeSubscriptions 
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

export { handleRevenueCatWebhook, syncRevenueCatSubscription };
