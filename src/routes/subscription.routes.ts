import express from 'express';
import { isAuthenticated } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import {
    verifySubscription,
    getUserSubscriptions,
    cancelSubscription,
    handleSubscriptionWebhookApple,
    handleSubscriptionWebhookGoogle,
    getSubscriptionHistory,
    checkSubscriptionStatus
} from '../controllers/subscription/subscription.controller';
import {
    handleRevenueCatWebhook,
    syncRevenueCatSubscription
} from '../controllers/subscription/revenuecat.controller';
import {
    verifySubscriptionSchema,
    cancelSubscriptionSchema,
    appleWebhookSchema,
    googleWebhookSchema,
    subscriptionStatusSchema
} from '../validations/subscription.schema';

const router = express.Router();

// Protected routes (require authentication)
router.post('/purchase',
    isAuthenticated,
    validate(verifySubscriptionSchema, 'body'),
    verifySubscription
);

router.post('/verify',
    isAuthenticated,
    validate(verifySubscriptionSchema, 'body'),
    verifySubscription
);

router.get('/my-subscriptions',
    isAuthenticated,
    getUserSubscriptions
);

router.get('/status',
    isAuthenticated,
    validate(subscriptionStatusSchema, 'query'),
    checkSubscriptionStatus
);

router.get('/history',
    isAuthenticated,
    getSubscriptionHistory
);

router.post('/cancel/:subscriptionId',
    isAuthenticated,
    validate(cancelSubscriptionSchema, 'params'),
    cancelSubscription
);

// Webhook endpoint (no authentication required as it will be called by Google/Apple)
router.post('/webhook/apple',
    validate(appleWebhookSchema, 'body'),
    handleSubscriptionWebhookApple
);

router.post('/webhook/google',
    validate(googleWebhookSchema, 'body'),
    handleSubscriptionWebhookGoogle
);

// RevenueCat Webhook
router.post('/webhook/revenuecat',
    handleRevenueCatWebhook
);
router.post('/webhook',
    handleRevenueCatWebhook
);

// Manual sync with RevenueCat
router.post('/sync',
    isAuthenticated,
    syncRevenueCatSubscription
);

export default router;
