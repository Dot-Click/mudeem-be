"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = __importDefault(require("../utils/logger"));
const loggerMiddleware = (req, res, next) => {
    logger_1.default.info({
        method: req.method,
        url: req.url,
        date: new Date(),
        message: 'Request received'
    });
    next();
};
exports.default = loggerMiddleware;
