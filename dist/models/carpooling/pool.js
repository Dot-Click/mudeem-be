"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const poolSchema = new mongoose_1.default.Schema({
    pickupLocation: {
        type: String,
        required: true
    },
    whereTo: {
        type: String,
        required: true
    },
    time: {
        type: String,
        required: true
    },
    availableSeats: {
        type: Number,
        required: true
    },
    user: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    rideEnded: {
        type: Boolean,
        default: false
    },
    rideStarted: {
        type: Boolean,
        default: false
    },
    existingUsers: [
        {
            type: mongoose_1.default.Schema.Types.ObjectId,
            ref: 'User',
        }
    ],
    droppedOffUsers: [
        {
            type: mongoose_1.default.Schema.Types.ObjectId,
            ref: 'User'
        }
    ]
}, {
    timestamps: true
});
const Pool = mongoose_1.default.model('Pool', poolSchema);
exports.default = Pool;
