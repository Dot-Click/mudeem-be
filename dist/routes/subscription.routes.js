"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const validate_middleware_1 = require("../middleware/validate.middleware");
const subscription_controller_1 = require("../controllers/subscription/subscription.controller");
const subscription_schema_1 = require("../validations/subscription.schema");
const router = express_1.default.Router();
// Protected routes (require authentication)
router.post('/verify', auth_middleware_1.isAuthenticated, (0, validate_middleware_1.validate)(subscription_schema_1.verifySubscriptionSchema), subscription_controller_1.verifySubscription);
router.get('/my-subscriptions', auth_middleware_1.isAuthenticated, subscription_controller_1.getUserSubscriptions);
router.get('/status', auth_middleware_1.isAuthenticated, (0, validate_middleware_1.validate)(subscription_schema_1.subscriptionStatusSchema), subscription_controller_1.checkSubscriptionStatus);
router.get('/history', auth_middleware_1.isAuthenticated, subscription_controller_1.getSubscriptionHistory);
router.post('/cancel/:subscriptionId', auth_middleware_1.isAuthenticated, (0, validate_middleware_1.validate)(subscription_schema_1.cancelSubscriptionSchema), subscription_controller_1.cancelSubscription);
// Webhook endpoint (no authentication required as it will be called by Google/Apple)
router.post('/webhook', (0, validate_middleware_1.validate)(subscription_schema_1.webhookSchema), subscription_controller_1.handleSubscriptionWebhook);
exports.default = router;
