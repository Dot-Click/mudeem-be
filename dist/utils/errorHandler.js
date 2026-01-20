"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = __importDefault(require("./logger"));
const ErrorHandler = ({ message, statusCode, req, res }) => {
    logger_1.default.error({
        method: req.method,
        url: req.url,
        date: new Date(),
        message: message
    });
    return res.status(statusCode).json({
        success: false,
        message: message
    });
};
exports.default = ErrorHandler;
