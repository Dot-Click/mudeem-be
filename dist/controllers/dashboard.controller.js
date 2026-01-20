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
exports.getAnalytics = void 0;
const user_model_1 = __importDefault(require("../models/user/user.model"));
const errorHandler_1 = __importDefault(require("../utils/errorHandler"));
const successHandler_1 = __importDefault(require("../utils/successHandler"));
const book_1 = __importDefault(require("../models/academy/book"));
const product_model_1 = __importDefault(require("../models/shop/product.model"));
const pool_1 = __importDefault(require("../models/carpooling/pool"));
const reel_1 = __importDefault(require("../models/content-creator/reel"));
const events_model_1 = __importDefault(require("../models/user/events.model"));
const post_1 = __importDefault(require("../models/collab-forum/post"));
const farm_model_1 = __importDefault(require("../models/farm/farm.model"));
const getAnalytics = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userCount = yield user_model_1.default.countDocuments();
        const bookCount = yield book_1.default.countDocuments();
        const productCount = yield product_model_1.default.countDocuments();
        const poolCount = yield pool_1.default.countDocuments();
        const reelCount = yield reel_1.default.countDocuments();
        const postCount = yield post_1.default.countDocuments();
        const eventCount = yield events_model_1.default.countDocuments();
        const farmCount = yield farm_model_1.default.countDocuments();
        return (0, successHandler_1.default)({
            res,
            data: {
                userCount,
                bookCount,
                productCount,
                poolCount,
                reelCount,
                eventCount,
                farmCount,
                postCount
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
exports.getAnalytics = getAnalytics;
