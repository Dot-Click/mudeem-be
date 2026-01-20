"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateStatusSchema = exports.createOrderSchema = exports.checkoutSchema = void 0;
const joi_1 = __importDefault(require("joi"));
const checkoutSchema = joi_1.default.object({
    cart: joi_1.default.array() // Array of objects
        .items(joi_1.default.object({
        product: joi_1.default.string().required(),
        variant: joi_1.default.string().required(),
        color: joi_1.default.string().required(),
        size: joi_1.default.string().required(),
        quantity: joi_1.default.number().required()
    }))
        .required()
        .messages({
        'array.base': 'Cart must be an array',
        'any.required': 'Cart is required'
    }),
    address: joi_1.default.object({
        name: joi_1.default.string().required(),
        address1: joi_1.default.string().required(),
        address2: joi_1.default.string().optional(),
        city: joi_1.default.string().required(),
        state: joi_1.default.string().required(),
        country: joi_1.default.string().required(),
        zip: joi_1.default.string().required()
    }).optional()
});
exports.checkoutSchema = checkoutSchema;
const createOrderSchema = joi_1.default.object({
    items: joi_1.default.array()
        .items(joi_1.default.object({
        product: joi_1.default.object().required(),
        variant: joi_1.default.object().required(),
        color: joi_1.default.string().required(),
        size: joi_1.default.string().required(),
        quantity: joi_1.default.number().required(),
        price: joi_1.default.number().required(),
        total: joi_1.default.number().required(),
        greenPoints: joi_1.default.number().required()
    }))
        .required(),
    deliveryCharge: joi_1.default.number().required(),
    totalAmount: joi_1.default.number().required(),
    totalGreenPoints: joi_1.default.number().required(),
    address: joi_1.default.object({
        name: joi_1.default.string().required(),
        address1: joi_1.default.string().required(),
        address2: joi_1.default.string().optional(),
        city: joi_1.default.string().required(),
        state: joi_1.default.string().required(),
        country: joi_1.default.string().required(),
        zip: joi_1.default.string().required()
    })
});
exports.createOrderSchema = createOrderSchema;
const updateStatusSchema = joi_1.default.object({
    orderId: joi_1.default.string().required(),
    status: joi_1.default.string().required()
});
exports.updateStatusSchema = updateStatusSchema;
