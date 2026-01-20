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
exports.get = exports.update = exports.create = void 0;
const settings_1 = require("../models/settings");
const errorHandler_1 = __importDefault(require("../utils/errorHandler"));
const upload_1 = __importDefault(require("../utils/upload"));
const successHandler_1 = __importDefault(require("../utils/successHandler"));
const create = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!(req === null || req === void 0 ? void 0 : req.files)) {
            return (0, errorHandler_1.default)({
                message: 'favicon and logo file is required',
                statusCode: 400,
                req,
                res
            });
        }
        console.log(req === null || req === void 0 ? void 0 : req.files);
        // @ts-ignore
        let favicon = yield (0, upload_1.default)(req.files.favIcon[0].buffer);
        // @ts-ignore
        let logo = yield (0, upload_1.default)(req.files.logo[0].buffer);
        yield settings_1.Setting.create(Object.assign(Object.assign({}, req.body), { favIcon: favicon.secure_url, logo: logo.secure_url }));
        return res.status(201).json({
            success: true,
            message: 'Setting created successfully'
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
exports.create = create;
const update = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
    try {
        const data = req.body;
        let favicon = { secure_url: '' };
        let logo = { secure_url: '' };
        if (req === null || req === void 0 ? void 0 : req.files) {
            // @ts-ignore
            if (((_a = req === null || req === void 0 ? void 0 : req.files) === null || _a === void 0 ? void 0 : _a.favIcon) && ((_c = (_b = req === null || req === void 0 ? void 0 : req.files) === null || _b === void 0 ? void 0 : _b.favIcon[0]) === null || _c === void 0 ? void 0 : _c.buffer)) {
                // @ts-ignore
                favicon = yield (0, upload_1.default)((_e = (_d = req === null || req === void 0 ? void 0 : req.files) === null || _d === void 0 ? void 0 : _d.favIcon[0]) === null || _e === void 0 ? void 0 : _e.buffer);
            }
            // @ts-ignore
            if (((_f = req === null || req === void 0 ? void 0 : req.files) === null || _f === void 0 ? void 0 : _f.logo) && ((_h = (_g = req === null || req === void 0 ? void 0 : req.files) === null || _g === void 0 ? void 0 : _g.logo[0]) === null || _h === void 0 ? void 0 : _h.buffer)) {
                // @ts-ignore
                logo = yield (0, upload_1.default)((_k = (_j = req === null || req === void 0 ? void 0 : req.files) === null || _j === void 0 ? void 0 : _j.logo[0]) === null || _k === void 0 ? void 0 : _k.buffer);
            }
        }
        const setting = yield settings_1.Setting.findOne();
        if (!setting) {
            return res.status(404).json({
                success: false,
                message: 'Setting not found'
            });
        }
        setting.logo = logo.secure_url || setting.logo;
        setting.favIcon = favicon.secure_url || setting.favIcon;
        setting.websiteName = data.websiteName;
        setting.websiteDescription = data.websiteDescription;
        setting.carPoolingGreenPoints = data.carPoolingGreenPoints;
        setting.greenMapGreenPoints = data.greenMapGreenPoints;
        setting.gptMessageGreenPoints = data.gptMessageGreenPoints;
        yield setting.save();
        return res.status(201).json({
            success: true,
            message: 'Setting updated successfully'
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
exports.update = update;
const get = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const setting = yield settings_1.Setting.findOne();
        if (!setting) {
            return res.status(404).json({
                success: false,
                message: 'Setting not found'
            });
        }
        return (0, successHandler_1.default)({ res, data: setting, statusCode: 200 });
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
exports.get = get;
