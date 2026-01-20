"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const subscriptionSchema = new mongoose_1.default.Schema({
    user: {
        type: mongoose_1.default.Schema.Types.ObjectId,
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
}, { timestamps: true });
// Index for faster queries
subscriptionSchema.index({ user: 1, type: 1 });
subscriptionSchema.index({ platformSubscriptionId: 1 }, { unique: true });
const Subscription = mongoose_1.default.model('Subscription', subscriptionSchema);
exports.default = Subscription;
