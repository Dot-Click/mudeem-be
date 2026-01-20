"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const reelSchema = new mongoose_1.default.Schema({
    user: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    url: {
        type: String,
        required: true
    },
    thumbnail: {
        type: String,
        required: false
    },
    description: {
        type: String
    },
    likes: {
        type: [mongoose_1.default.Schema.Types.ObjectId],
        ref: 'User'
    },
    comments: {
        type: [mongoose_1.default.Schema.Types.ObjectId],
        ref: 'ReelComment'
    }
});
const Reel = mongoose_1.default.model('Reel', reelSchema);
exports.default = Reel;
