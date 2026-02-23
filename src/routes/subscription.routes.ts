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
    verifySubscriptionSchema,
    cancelSubscriptionSchema,
    appleWebhookSchema,
    googleWebhookSchema,
    subscriptionStatusSchema
} from '../validations/subscription.schema';

const router = express.Router();

// Protected routes (require authentication)
router.post('/verify',
    isAuthenticated,
    validate(verifySubscriptionSchema),
    verifySubscription
);

router.get('/my-subscriptions',
    isAuthenticated,
    getUserSubscriptions
);

router.get('/status',
    isAuthenticated,
    validate(subscriptionStatusSchema),
    checkSubscriptionStatus
);

router.get('/history',
    isAuthenticated,
    getSubscriptionHistory
);

router.post('/cancel/:subscriptionId',
    isAuthenticated,
    validate(cancelSubscriptionSchema),
    cancelSubscription
);

// Webhook endpoint (no authentication required as it will be called by Google/Apple)
router.post('/webhook/apple',
    validate(appleWebhookSchema),
    handleSubscriptionWebhookApple
);

router.post('/webhook/google',
    validate(googleWebhookSchema),
    handleSubscriptionWebhookGoogle
);

export default router;