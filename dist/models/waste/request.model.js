"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const requestSchema = new mongoose_1.default.Schema({
    user: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    company: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'Company',
        required: true
    },
    status: {
        type: String,
        enum: ['requested', 'accepted', 'rejected'],
        default: 'requested'
    },
    wasteType: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    address1: {
        type: String,
        required: true
    },
    address2: {
        type: String
        //   required: true
    },
    pickupDateTime: {
        type: Date,
        required: true
    }
}, {
    timestamps: true
});
const Waste = mongoose_1.default.model('RequestWaste', requestSchema);
exports.default = Waste;
