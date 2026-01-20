"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createProject = void 0;
const joi_1 = __importDefault(require("joi"));
const createProject = joi_1.default.object({
    title: joi_1.default.string().required().messages({
        'string.base': 'title must be a string',
        'any.required': 'title is required'
    }),
    description: joi_1.default.string().required().messages({
        'string.base': 'description must be a string',
        'any.required': 'description is required'
    }),
    documents: joi_1.default.string().optional()
});
exports.createProject = createProject;
