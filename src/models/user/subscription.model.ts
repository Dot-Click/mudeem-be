import mongoose, { Model } from 'mongoose';
import { ISubscription } from '../../types/models/user';

const subscriptionSchema = new mongoose.Schema<ISubscription>(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        type: {
            type: String,
            enum: ['sustainbuddy_gpt', 'content_creator'],
            required: true
        },
        platform: {
            type: String,
            enum: ['google_play', 'apple_store'],
            required: true
        },
        status: {
            type: String,
            enum: ['active', 'cancelled', 'expired', 'pending'],
            default: 'pending'
        },
        startDate: {
            type: Date,
            required: true
        },
        endDate: {
            type: Date,
            required: true
        },
        platformSubscriptionId: {
            type: String,
            required: true
        },
        receiptData: {
            type: Object,
            required: true
        },
        autoRenew: {
            type: Boolean,
            default: true
        },
        lastVerifiedAt: {
            type: Date,
            default: Date.now
        }
    },
    { timestamps: true }
);

// Index for faster queries
subscriptionSchema.index({ user: 1, type: 1 });
subscriptionSchema.index({ platformSubscriptionId: 1 }, { unique: true });

const Subscription: Model<ISubscription> = mongoose.model<ISubscription>('Subscription', subscriptionSchema);

export default Subscription; 