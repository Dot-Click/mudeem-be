"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const greenMapSchema = new mongoose_1.default.Schema({
    description: {
        type: String,
        required: true
    },
    location: {
        type: String,
        required: true
    },
    coordinates: {
        lat: {
            type: Number,
            required: true
        },
        lng: {
            type: Number,
            required: true
        }
    },
    category: {
        type: String,
        required: true
    },
    greenPointsPerTime: {
        type: Number,
        required: true
    }
}, {
    timestamps: true
});
const GreenMap = mongoose_1.default.model('GreenMap', greenMapSchema);
exports.default = GreenMap;
