import express from 'express';
import { isAuthenticated } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import {
    verifySubscription,
    getUserSubscriptions,
    cancelSubscription,
    handleSubscriptionWebhook,
    getSubscriptionHistory,
    checkSubscriptionStatus
} from '../controllers/subscription/subscription.controller';
import {
    verifySubscriptionSchema,
    cancelSubscriptionSchema,
    webhookSchema,
    subscriptionStatusSchema
} from '../validations/subscription.schema';

const router = express.Router();

// Protected routes (require authentication)
router.post('/verify',
    isAuthenticated,
    validateRequest(verifySubscriptionSchema),
    verifySubscription
);

router.get('/my-subscriptions',
    isAuthenticated,
    getUserSubscriptions
);

router.get('/status',
    isAuthenticated,
    validateRequest(subscriptionStatusSchema, 'query'),
    checkSubscriptionStatus
);

router.get('/history',
    isAuthenticated,
    getSubscriptionHistory
);

router.post('/cancel/:subscriptionId',
    isAuthenticated,
    validateRequest(cancelSubscriptionSchema, 'params'),
    cancelSubscription
);

// Webhook endpoint (no authentication required as it will be called by Google/Apple)
router.post('/webhook',
    validateRequest(webhookSchema),
    handleSubscriptionWebhook
);

export default router;