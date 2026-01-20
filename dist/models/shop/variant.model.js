"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const variantSchema = new mongoose_1.default.Schema({
    name: {
        type: String,
        required: true
    },
    name_ar: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    sizes: [
        {
            size: {
                type: String,
                required: true
            },
            stock: {
                type: Number,
                default: 0
            }
        }
    ],
    colors: [
        {
            color: {
                type: String,
                required: true
            },
            stock: {
                type: Number,
                default: 0
            }
        }
    ],
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });
const Variant = mongoose_1.default.model('Variant', variantSchema);
exports.default = Variant;
