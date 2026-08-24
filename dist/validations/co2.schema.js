"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzeCo2 = void 0;
const joi_1 = __importDefault(require("joi"));
const analyzeCo2 = joi_1.default.object({
    imageUrl: joi_1.default.string().uri().required().messages({
        'string.base': 'imageUrl must be a string',
        'string.uri': 'imageUrl must be a valid URL',
        'any.required': 'imageUrl is required'
    }),
    weightInGrams: joi_1.default.string()
        .required()
        .custom((value, helpers) => {
        const parsed = Number(value);
        if (!Number.isFinite(parsed) || parsed <= 0) {
            return helpers.error('any.invalid');
        }
        return value;
    })
        .messages({
        'string.base': 'weightInGrams must be a string',
        'any.required': 'weightInGrams is required',
        'any.invalid': 'weightInGrams must be a number greater than 0'
    }),
    language: joi_1.default.string().optional().allow('').messages({
        'string.base': 'language must be a string'
    })
});
exports.analyzeCo2 = analyzeCo2;
