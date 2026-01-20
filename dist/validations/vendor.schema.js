"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.approveVendor = void 0;
const joi_1 = __importDefault(require("joi"));
const approveVendor = joi_1.default.object({
    approved: joi_1.default.boolean().required().messages({
        'boolean.base': 'Approved must be a boolean',
        'any.required': 'Approved is required'
    })
});
exports.approveVendor = approveVendor;
