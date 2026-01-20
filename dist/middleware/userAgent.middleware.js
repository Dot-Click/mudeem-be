"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.captureLastActive = exports.captureUserAgent = void 0;
const ua_parser_js_1 = __importDefault(require("ua-parser-js"));
const captureUserAgent = (req, res, next) => {
    if (!req.session.deviceInfo) {
        const parser = new ua_parser_js_1.default(req.headers['user-agent']);
        const result = parser.getResult();
        req.session.deviceInfo = {
            browser: result.browser.name,
            version: result.browser.version,
            os: result.os.name
        };
        req.session.lastActive = new Date();
    }
    next();
};
exports.captureUserAgent = captureUserAgent;
const captureLastActive = (req, res, next) => {
    if (req.isAuthenticated()) {
        req.session.lastActive = new Date();
    }
    next();
};
exports.captureLastActive = captureLastActive;
