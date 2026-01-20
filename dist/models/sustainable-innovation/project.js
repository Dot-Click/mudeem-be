"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
// import { IPost } from 'types/models/collab-forum';
const projectSchema = new mongoose_1.default.Schema({
    user: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['requested', 'accepted', 'rejected'],
        default: 'requested'
    },
    description: {
        type: String,
        required: true
    },
    documents: [
        {
            type: String
        }
    ]
}, {
    timestamps: true
});
const Project = mongoose_1.default.model('Project', projectSchema);
exports.default = Project;
