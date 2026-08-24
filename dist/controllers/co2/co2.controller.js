"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyze = void 0;
const openai_1 = __importDefault(require("openai"));
const errorHandler_1 = __importDefault(require("../../utils/errorHandler"));
const successHandler_1 = __importDefault(require("../../utils/successHandler"));
const openai_2 = require("../../utils/openai");
const co2Usage_model_1 = __importDefault(require("../../models/co2/co2Usage.model"));
const DAILY_LIMIT = 50;
const CLOUDINARY_HOST = 'res.cloudinary.com';
/**
 * Cloud names whose delivery URLs this endpoint will accept.
 *
 * The mobile app uploads to its own Cloudinary account, which is not the one
 * the backend uploads to, so the allowlist has to be explicit. Set
 * CO2_ALLOWED_CLOUD_NAMES to a comma-separated list; it falls back to
 * CLOUDINARY_NAME when unset.
 */
const allowedCloudNames = () => (process.env.CO2_ALLOWED_CLOUD_NAMES || process.env.CLOUDINARY_NAME || '')
    .split(',')
    .map((name) => name.trim())
    .filter(Boolean);
const isAllowedImageUrl = (rawUrl) => {
    let parsed;
    try {
        parsed = new URL(rawUrl);
    }
    catch (_a) {
        return false;
    }
    if (parsed.protocol !== 'https:')
        return false;
    if (parsed.hostname !== CLOUDINARY_HOST)
        return false;
    const names = allowedCloudNames();
    if (names.length === 0)
        return false;
    return names.some((name) => parsed.pathname.startsWith(`/${name}/`));
};
const extractJson = (raw) => {
    const withoutFence = raw
        .trim()
        .replace(/^```(?:json)?/i, '')
        .replace(/```$/, '')
        .trim();
    const start = withoutFence.indexOf('{');
    const end = withoutFence.lastIndexOf('}');
    if (start === -1 || end === -1 || end < start)
        return null;
    try {
        return JSON.parse(withoutFence.slice(start, end + 1));
    }
    catch (_a) {
        return null;
    }
};
const refundDailyUsage = (userId, dateKey) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield co2Usage_model_1.default.updateOne({ user: userId, date: dateKey, count: { $gt: 0 } }, { $inc: { count: -1 } });
    }
    catch (_a) {
        // A failed refund must not mask the original provider error.
    }
});
const analyze = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    // #swagger.tags = ['co2']
    try {
        const { imageUrl, weightInGrams } = req.body;
        const language = req.body.language === 'ar' ? 'ar' : 'en';
        if (!isAllowedImageUrl(imageUrl)) {
            return (0, errorHandler_1.default)({
                message: 'imageUrl is not a valid Cloudinary URL',
                statusCode: 400,
                req,
                res
            });
        }
        const weight = Number(weightInGrams);
        if (!Number.isFinite(weight) || weight <= 0) {
            return (0, errorHandler_1.default)({
                message: 'weightInGrams must be a number greater than 0',
                statusCode: 400,
                req,
                res
            });
        }
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        const todayKey = new Date().toISOString().slice(0, 10);
        const usage = yield co2Usage_model_1.default.findOneAndUpdate({ user: userId, date: todayKey }, { $inc: { count: 1 } }, { upsert: true, new: true });
        if (usage.count > DAILY_LIMIT) {
            // The app maps `code` to a translated message. A bare 429 is
            // indistinguishable from the per-minute limiter, which tells the user to
            // retry "in a moment" — wrong advice for a cap that resets tomorrow.
            return (0, errorHandler_1.default)({
                message: 'Daily CO2 scan limit reached',
                statusCode: 429,
                code: 'DAILY_LIMIT',
                req,
                res
            });
        }
        let raw;
        try {
            raw = yield (0, openai_2.requestCo2Analysis)(imageUrl, weight, language);
        }
        catch (error) {
            // The scan never ran, so give the user their daily allowance back.
            // Without this a provider outage silently burns all 50 attempts.
            yield refundDailyUsage(userId, todayKey);
            if (error instanceof openai_1.default.APIError) {
                const statusCode = error.status === 429 ? 429 : error.status === 401 || error.status === 403 ? error.status : 502;
                return (0, errorHandler_1.default)({
                    message: 'CO2 analysis provider request failed',
                    statusCode,
                    req,
                    res
                });
            }
            return (0, errorHandler_1.default)({
                message: 'CO2 analysis provider request failed',
                statusCode: 502,
                req,
                res
            });
        }
        if (!raw) {
            return (0, successHandler_1.default)({ res, data: { status: 'error' }, statusCode: 200 });
        }
        const parsed = extractJson(raw);
        if (!parsed || parsed.status !== 'success') {
            return (0, successHandler_1.default)({ res, data: { status: 'error' }, statusCode: 200 });
        }
        const itemName = parsed.item_name;
        const emission = parsed.total_co2_emission_in_grams;
        if (typeof itemName !== 'string' ||
            !itemName.trim() ||
            (typeof emission !== 'string' && typeof emission !== 'number')) {
            return (0, successHandler_1.default)({ res, data: { status: 'error' }, statusCode: 200 });
        }
        return (0, successHandler_1.default)({
            res,
            data: {
                status: 'success',
                item_name: itemName,
                total_co2_emission_in_grams: String(emission)
            },
            statusCode: 200
        });
    }
    catch (error) {
        return (0, errorHandler_1.default)({
            message: error.message,
            statusCode: 500,
            req,
            res
        });
    }
});
exports.analyze = analyze;
