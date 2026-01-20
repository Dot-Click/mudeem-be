"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCommentReply = exports.createUpdateComment = exports.createUpdatePost = void 0;
const joi_1 = __importDefault(require("joi"));
const createUpdatePost = joi_1.default.object({
    content: joi_1.default.string().required().messages({
        'string.base': 'Content must be a string',
        'any.required': 'Content is required'
    }),
    images: joi_1.default.array().items(joi_1.default.string()).optional().min(1).messages({
        'array.base': 'Images must be an array',
        'array.min': 'Images must have at least 1 image'
    })
});
exports.createUpdatePost = createUpdatePost;
const createUpdateComment = joi_1.default.object({
    content: joi_1.default.string().required().messages({
        'string.base': 'Content must be a string',
        'any.required': 'Content is required'
    })
});
exports.createUpdateComment = createUpdateComment;
const createCommentReply = joi_1.default.object({
    content: joi_1.default.string().required().messages({
        'string.base': 'Content must be a string',
        'any.required': 'Content is required'
    })
});
exports.createCommentReply = createCommentReply;
