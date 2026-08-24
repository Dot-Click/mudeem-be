"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = __importDefault(require("./logger"));
const ErrorHandler = ({ message, statusCode, req, res, code }) => {
    var _a, _b;
    logger_1.default.error({
        method: req.method,
        url: req.originalUrl || req.url,
        statusCode,
        userId: ((_b = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id) === null || _b === void 0 ? void 0 : _b.toString()) || null,
        ip: req.ip,
        date: new Date(),
        message: message
    });
    return res.status(statusCode).json(Object.assign({ success: false, message: message }, (code ? { code } : {})));
};
exports.default = ErrorHandler;
