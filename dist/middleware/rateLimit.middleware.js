"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUserRateLimitMiddleware = exports.createSensitiveRateLimitMiddleware = exports.rateLimitMiddleware = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const rateLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, res) => {
        res.status(429).json({
            success: false,
            message: 'Too many requests from this IP, please try again after 15 minutes',
            code: 'RATE_LIMIT'
        });
    }
});
const rateLimitMiddleware = (req, res, next) => {
    rateLimiter(req, res, next);
};
exports.rateLimitMiddleware = rateLimitMiddleware;
const createSensitiveRateLimitMiddleware = (max, windowMs = 60 * 1000) => (0, express_rate_limit_1.default)({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => { var _a, _b; return ((_b = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id) === null || _b === void 0 ? void 0 : _b.toString()) || req.ip; },
    handler: (_req, res) => {
        res.status(429).json({
            success: false,
            message: 'Too many sensitive requests, please try again shortly.',
            code: 'RATE_LIMIT'
        });
    }
});
exports.createSensitiveRateLimitMiddleware = createSensitiveRateLimitMiddleware;
const createUserRateLimitMiddleware = (max, windowMs, message) => (0, express_rate_limit_1.default)({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => { var _a, _b; return ((_b = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id) === null || _b === void 0 ? void 0 : _b.toString()) || req.ip; },
    handler: (_req, res) => {
        res.status(429).json({ success: false, message, code: 'RATE_LIMIT' });
    }
});
exports.createUserRateLimitMiddleware = createUserRateLimitMiddleware;
