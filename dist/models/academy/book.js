"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const bookSchema = new mongoose_1.default.Schema({
    title: {
        type: String,
        required: true
    },
    title_ar: {
        type: String,
        required: true
    },
    author: {
        type: String,
        required: true
    },
    author_ar: {
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
    pages: {
        type: Number,
        required: true
    },
    thumbnail: {
        type: String,
        required: true
    },
    language: {
        type: String,
        required: true
    },
    year: {
        type: Number,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    type: {
        type: String,
        required: true,
        enum: ['new', 'popular']
    },
    greenPoints: {
        type: Number,
        required: true
    }
}, {
    timestamps: true
});
const Book = mongoose_1.default.model('Book', bookSchema);
exports.default = Book;
