"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Setting = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const settingSchema = new mongoose_1.default.Schema({
    logo: { type: String },
    favIcon: { type: String },
    websiteName: { type: String, default: "Mudeem" },
    websiteDescription: { type: String, default: "" },
    carPoolingGreenPoints: { type: Number, default: 0 },
    greenMapGreenPoints: { type: Number, default: 0 },
    gptMessageGreenPoints: { type: Number, default: 0 },
}, { timestamps: true });
exports.Setting = mongoose_1.default.model("Setting", settingSchema);
