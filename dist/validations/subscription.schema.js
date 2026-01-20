"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.subscriptionStatusSchema = exports.webhookSchema = exports.cancelSubscriptionSchema = exports.verifySubscriptionSchema = void 0;
const joi_1 = __importDefault(require("joi"));
// Validation schema for subscription verification
exports.verifySubscriptionSchema = joi_1.default.object({
    platform: joi_1.default.string()
        .valid('google_play', 'apple_store')
        .required()
        .messages({
        'any.only': 'Platform must be either google_play or apple_store',
        'any.required': 'Platform is required'
    }),
    receipt: joi_1.default.string()
        .required()
        .messages({
        'any.required': 'Receipt data is required'
    }),
    type: joi_1.default.string()
        .valid('sustainbuddy_gpt', 'content_creator')
        .required()
        .messages({
        'any.only': 'Subscription type must be either sustainbuddy_gpt or content_creator',
        'any.required': 'Subscription type is required'
    })
});
// Validation schema for subscription cancellation
exports.cancelSubscriptionSchema = joi_1.default.object({
    subscriptionId: joi_1.default.string()
        .required()
        .messages({
        'any.required': 'Subscription ID is required'
    })
});
// Validation schema for webhook events
exports.webhookSchema = joi_1.default.object({
    platform: joi_1.default.string()
        .valid('google_play', 'apple_store')
        .required(),
    event: joi_1.default.string()
        .valid('subscription_renewed', 'subscription_cancelled', 'subscription_expired')
        .required(),
    subscriptionId: joi_1.default.string()
        .required(),
    data: joi_1.default.object({
        newExpiryDate: joi_1.default.date().optional()
    }).optional()
});
// Validation schema for subscription status query
exports.subscriptionStatusSchema = joi_1.default.object({
    type: joi_1.default.string()
        .valid('sustainbuddy_gpt', 'content_creator', 'all')
        .optional()
        .default('all')
});
