"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const productSchema = new mongoose_1.default.Schema({
    name: {
        type: String,
        required: true
    },
    name_ar: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    description_ar: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    category: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'Category',
        required: true
    },
    images: [
        {
            type: String
        }
    ],
    variants: [
        {
            type: mongoose_1.default.Schema.Types.ObjectId,
            ref: 'Variant'
        }
    ],
    isActive: {
        type: Boolean,
        default: true
    },
    // user: {
    //   type: mongoose.Schema.Types.ObjectId,
    //   ref: 'User',
    //   required: true
    // },
    greenPointsPerUnit: {
        type: Number,
        default: 0
    },
    rating: {
        stars: {
            type: Number,
            default: 0
        },
        total: {
            type: Number,
            default: 0
        }
    },
    reviews: [
        {
            type: mongoose_1.default.Schema.Types.ObjectId,
            ref: 'Review'
        }
    ],
    stock: {
        type: Boolean,
        default: true
    },
    brand: {
        type: String,
        required: true
    },
    brand_ar: {
        type: String,
        required: true
    },
    featured: {
        type: Boolean,
        default: false
    },
    sold: {
        type: Number,
        default: 0
    },
    vendor: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'Vendor',
        required: true
    }
}, { timestamps: true });
const Product = mongoose_1.default.model('Product', productSchema);
exports.default = Product;
