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
exports.deletebanner = exports.updateBanner = exports.createBanner = exports.getBanners = void 0;
const successHandler_1 = __importDefault(require("../../utils/successHandler"));
const errorHandler_1 = __importDefault(require("../../utils/errorHandler"));
const banner_model_1 = __importDefault(require("../../models/shop/banner.model"));
const upload_1 = __importDefault(require("../../utils/upload"));
const getBanners = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // #swagger.tags = ['category']
    try {
        const { type = 'shop' } = req.query;
        const banners = yield banner_model_1.default.find({ type: type });
        return (0, successHandler_1.default)({
            data: { message: `Banners fetched`, banners },
            statusCode: 201,
            res
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
exports.getBanners = getBanners;
const createBanner = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // #swagger.tags = ['category']
    try {
        const { name, type = 'shop' } = req.body;
        let image = { secure_url: 'dfff' };
        if (!req.file) {
            return (0, errorHandler_1.default)({
                message: 'Image is required',
                statusCode: 400,
                req,
                res
            });
        }
        // const urls: string[] = await uploadFile([req.file as Express.Multer.File]);
        if (req === null || req === void 0 ? void 0 : req.file) {
            image = yield (0, upload_1.default)(req.file.buffer);
        }
        const banner = yield banner_model_1.default.create({
            name,
            type,
            image: image.secure_url
        });
        return (0, successHandler_1.default)({
            data: { message: `Banner created`, banner },
            statusCode: 201,
            res
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
exports.createBanner = createBanner;
const updateBanner = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // #swagger.tags = ['category']
    try {
        const banner = yield banner_model_1.default.findById(req.params.id);
        if (!banner) {
            return (0, errorHandler_1.default)({
                message: 'Category not found',
                statusCode: 404,
                req,
                res
            });
        }
        const { name } = req.body;
        banner.name = name;
        if (req.file) {
            let image = yield (0, upload_1.default)(req.file.buffer);
            // const urls: string[] = await uploadFile([req.file
            // as Express.Multer.File]);
            banner.image = image.secure_url;
        }
        yield banner.save();
        return (0, successHandler_1.default)({
            data: { message: 'Banner updated', banner },
            statusCode: 200,
            res
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
exports.updateBanner = updateBanner;
const deletebanner = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // #swagger.tags = ['category']
    try {
        const banner = yield banner_model_1.default.findById(req.params.id);
        if (!banner) {
            return (0, errorHandler_1.default)({
                message: 'Banner not found',
                statusCode: 404,
                req,
                res
            });
        }
        yield banner_model_1.default.findByIdAndDelete(req.params.id);
        return (0, successHandler_1.default)({
            data: { message: 'Banner deleted' },
            statusCode: 200,
            res
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
exports.deletebanner = deletebanner;
