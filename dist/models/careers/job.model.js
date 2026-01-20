"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const jobSchema = new mongoose_1.default.Schema({
    title: {
        type: String,
        required: true
    },
    image: {
        type: String,
        required: true,
        default: 'false'
    },
    location: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    salary: {
        type: Number,
        required: true
    },
    company: {
        type: String,
        required: true
    },
    linkedInUrl: {
        type: String,
        required: true
    },
    jobType: {
        type: String,
        required: true
    }
}, {
    timestamps: true
});
const Job = mongoose_1.default.model('Job', jobSchema);
exports.default = Job;
