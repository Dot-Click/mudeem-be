import Joi from 'joi';

// Validation schema for subscription verification
export const verifySubscriptionSchema = Joi.object({
    platform: Joi.string()
        .valid('google_play', 'apple_store')
        .required()
        .messages({
            'any.only': 'Platform must be either google_play or apple_store',
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

// Validation schema for webhook events
export const webhookSchema = Joi.object({
    platform: Joi.string()
        .valid('google_play', 'apple_store')
        .required(),
    event: Joi.string()
        .valid('subscription_renewed', 'subscription_cancelled', 'subscription_expired')
        .required(),
    subscriptionId: Joi.string()
        .required(),
    data: Joi.object({
        newExpiryDate: Joi.date().optional()
    }).optional()
});

// Validation schema for subscription status query
export const subscriptionStatusSchema = Joi.object({
    type: Joi.string()
        .valid('sustainbuddy_gpt', 'content_creator', 'all')
        .optional()
        .default('all')
}); 