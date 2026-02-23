"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.subscriptionStatusSchema = exports.googleWebhookSchema = exports.appleWebhookSchema = exports.cancelSubscriptionSchema = exports.verifySubscriptionSchema = void 0;
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
// Validation schema for Apple webhook events
exports.appleWebhookSchema = joi_1.default.object({
    signedPayload: joi_1.default.string()
        .required()
});
// Validation schema for Google webhook events
exports.googleWebhookSchema = joi_1.default.object({
    message: joi_1.default.object({
        data: joi_1.default.string().required(),
        messageId: joi_1.default.string().required(),
        publishTime: joi_1.default.string().required(),
    }).required(),
    subscription: joi_1.default.string().required(),
});
// Validation schema for subscription status query
exports.subscriptionStatusSchema = joi_1.default.object({
    type: joi_1.default.string()
        .valid('sustainbuddy_gpt', 'content_creator', 'all')
        .optional()
        .default('all')
});
