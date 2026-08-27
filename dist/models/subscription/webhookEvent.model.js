"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const webhookEventSchema = new mongoose_1.default.Schema({
    eventId: {
        type: String,
        required: true
    },
    provider: {
        type: String,
        required: true,
        default: 'revenue_cat'
    },
    eventType: {
        type: String,
        required: true
    },
    processedAt: {
        type: Date,
        default: Date.now
    }
});
// The unique index is what makes processing idempotent: RevenueCat retries any
// delivery we do not answer with a 2xx, so the same event can arrive several
// times. Insert-then-catch-duplicate is atomic, unlike find-then-insert.
webhookEventSchema.index({ provider: 1, eventId: 1 }, { unique: true });
// Retention only needs to outlive RevenueCat's retry window (days, not months).
webhookEventSchema.index({ processedAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });
const WebhookEvent = mongoose_1.default.model('WebhookEvent', webhookEventSchema);
exports.default = WebhookEvent;
