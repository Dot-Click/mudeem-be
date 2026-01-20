"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const order = new mongoose_1.default.Schema({
    user: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    items: [
        {
            product: {
                type: Object,
                // ref: 'Product',
                required: true
            },
            variant: {
                type: Object,
                // ref: 'Variant',
                required: true
            },
            color: {
                type: String,
                required: true
            },
            size: {
                type: String,
                required: true
            },
            quantity: {
                type: Number,
                required: true
            }
        }
    ],
    totalAmount: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['confirmed', 'shipped', 'delivered'],
        required: true
    },
    deliveryCharge: {
        type: Number,
        required: true
    },
    address: {
        type: Object,
        required: true
    },
    totalGreenPoints: {
        type: Number,
        required: true
    },
    vendor: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, { timestamps: true });
const Order = mongoose_1.default.model('Order', order);
exports.default = Order;
