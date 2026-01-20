"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateBanner = exports.createBanner = void 0;
const joi_1 = __importDefault(require("joi"));
const createBanner = joi_1.default.object({
    name: joi_1.default.string().min(3).required().messages({
        'string.base': 'Name must be a string',
        'string.empty': 'Name cannot be empty',
        'string.min': 'Name should have a minimum length of {#limit}',
        'any.required': 'Name is required'
    }),
    image: joi_1.default.string().optional()
});
exports.createBanner = createBanner;
const updateBanner = joi_1.default.object({
    name: joi_1.default.string().min(3).messages({
        'string.base': 'Name must be a string',
        'string.empty': 'Name cannot be empty',
        'string.min': 'Name should have a minimum length of {#limit}'
    }),
    image: joi_1.default.string().optional()
});
exports.updateBanner = updateBanner;
