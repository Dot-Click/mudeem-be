"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const farmSchema = new mongoose_1.default.Schema({
    user: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    location: {
        type: String,
        required: true
    },
    renewableEnergy: {
        type: String,
        required: true
    },
    fertilizer: {
        type: String,
        required: true
    },
    desalinationMethod: {
        type: String,
        required: true
    },
    farmDesignSpecs: {
        type: String,
        required: true
    },
    desiredEquipment: {
        type: String,
        required: true
    },
    budgetDetails: {
        type: String,
        required: true
    },
    electricGeneration: {
        type: String,
        required: true
    },
    images: {
        type: [String],
        required: true
    },
    status: {
        type: String,
        default: 'pending'
    }
}, { timestamps: true });
const Farm = mongoose_1.default.model('Farm', farmSchema);
exports.default = Farm;
