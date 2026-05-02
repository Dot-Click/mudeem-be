import Joi from 'joi';

// Validation schema for subscription verification
export const verifySubscriptionSchema = Joi.object({
    platform: Joi.string()
        .valid('google_play', 'apple_store', 'revenue_cat')
        .required()
        .messages({
            'any.only': 'Platform must be one of: google_play, apple_store, revenue_cat',
            'any.required': 'Platform is required'
        }),
    receipt: Joi.string()
        .required()
        .messages({
            'any.required': 'Receipt data is required'
        }),
    type: Joi.string()
        .valid('sustainbuddy_gpt', 'content_creator')
        .required()
        .messages({
            'any.only': 'Subscription type must be either sustainbuddy_gpt or content_creator',
            'any.required': 'Subscription type is required'
        })
});

// Validation schema for subscription cancellation
export const cancelSubscriptionSchema = Joi.object({
    subscriptionId: Joi.string()
        .required()
        .messages({
            'any.required': 'Subscription ID is required'
        })
});

// Validation schema for Apple webhook events
export const appleWebhookSchema = Joi.object({
    signedPayload: Joi.string()
        .required()
});

// Validation schema for Google webhook events
export const googleWebhookSchema = Joi.object({
    message: Joi.object({
        data: Joi.string().required(),
        messageId: Joi.string().required(),
        publishTime: Joi.string().required(),
    }).required(),
    subscription: Joi.string().required(),
});

// Validation schema for subscription status query
export const subscriptionStatusSchema = Joi.object({
    type: Joi.string()
        .valid('sustainbuddy_gpt', 'content_creator', 'all')
        .optional()
        .default('all')
}); 