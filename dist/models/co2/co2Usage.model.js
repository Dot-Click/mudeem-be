"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const co2UsageSchema = new mongoose_1.default.Schema({
    user: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    date: {
        type: String,
        required: true
    },
    count: {
        type: Number,
        required: true,
        default: 0
    }
}, {
    timestamps: true
});
co2UsageSchema.index({ user: 1, date: 1 }, { unique: true });
const Co2Usage = mongoose_1.default.model('Co2Usage', co2UsageSchema);
exports.default = Co2Usage;
