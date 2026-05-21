"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = __importDefault(require("../utils/logger"));
const loggerMiddleware = (req, res, next) => {
    const startedAt = Date.now();
    res.on('finish', () => {
        var _a, _b;
        logger_1.default.info({
            method: req.method,
            url: req.originalUrl || req.url,
            statusCode: res.statusCode,
            userId: ((_b = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id) === null || _b === void 0 ? void 0 : _b.toString()) || null,
            ip: req.ip,
            durationMs: Date.now() - startedAt,
            date: new Date(),
            message: 'Request completed'
        });
    });
    next();
};
exports.default = loggerMiddleware;
