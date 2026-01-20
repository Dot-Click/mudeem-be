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
exports.approveRejectFarm = exports.getFarm = exports.getFarms = exports.createFarm = void 0;
const errorHandler_1 = __importDefault(require("../../utils/errorHandler"));
const successHandler_1 = __importDefault(require("../../utils/successHandler"));
const upload_1 = __importDefault(require("../../utils/upload"));
const farm_model_1 = __importDefault(require("../../models/farm/farm.model"));
const user_model_1 = __importDefault(require("../../models/user/user.model"));
const firebase_1 = require("../../utils/firebase");
const createFarm = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    // #swagger.tags = ['farm']
    try {
        const { location, renewableEnergy, fertilizer, desalinationMethod, farmDesignSpecs, desiredEquipment, budgetDetails, electricGeneration } = req.body;
        console.log('fdffd');
        if (!((_a = req === null || req === void 0 ? void 0 : req.files) === null || _a === void 0 ? void 0 : _a.length)) {
            return (0, errorHandler_1.default)({
                message: 'Please upload images',
                statusCode: 400,
                req,
                res
            });
        }
        let images = yield Promise.all(((_b = req === null || req === void 0 ? void 0 : req.files) === null || _b === void 0 ? void 0 : _b.map((item) => __awaiter(void 0, void 0, void 0, function* () {
            const result = yield (0, upload_1.default)(item === null || item === void 0 ? void 0 : item.buffer);
            return result.secure_url;
        }))) || []);
        const farm = yield farm_model_1.default.create({
            user: (_c = req.user) === null || _c === void 0 ? void 0 : _c._id,
            location,
            renewableEnergy,
            fertilizer,
            desalinationMethod,
            farmDesignSpecs,
            desiredEquipment,
            budgetDetails,
            electricGeneration,
            images
        });
        return (0, successHandler_1.default)({
            res,
            data: { farm, message: 'Farm created successfully' },
            statusCode: 201
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
exports.createFarm = createFarm;
const getFarms = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    // #swagger.tags = ['farm']
    try {
        const { page = 0, limit = 10 } = req.query;
        const skip = Number(page) * Number(limit);
        const filter = {};
        req.query.location &&
            (filter['location'] = {
                $regex: String(req.query.location),
                $options: 'i'
            });
        req.query.renewableEnergy &&
            (filter['renewableEnergy'] = String(req.query.renewableEnergy));
        req.query.fertilizer &&
            (filter['fertilizer'] = String(req.query.fertilizer));
        req.query.desalinationMethod &&
            (filter['desalinationMethod'] = String(req.query.desalinationMethod));
        req.query.status && (filter['status'] = String(req.query.status));
        ((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) === 'user' && (filter['user'] = (_b = req.user) === null || _b === void 0 ? void 0 : _b._id);
        const farms = yield farm_model_1.default.find(filter)
            .populate('user')
            .skip(skip)
            .limit(Number(limit))
            .sort({
            createdAt: -1
        });
        return (0, successHandler_1.default)({ res, data: farms, statusCode: 200 });
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
exports.getFarms = getFarms;
const getFarm = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // #swagger.tags = ['farm']
    try {
        const farm = yield farm_model_1.default.findById(req.params.id).populate('user');
        if (!farm) {
            return (0, errorHandler_1.default)({
                message: 'Farm not found',
                statusCode: 404,
                req,
                res
            });
        }
        return (0, successHandler_1.default)({ res, data: farm, statusCode: 200 });
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
exports.getFarm = getFarm;
const approveRejectFarm = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // #swagger.tags = ['farm']
    try {
        const { id } = req.params;
        const { status } = req.body;
        const farm = yield farm_model_1.default.findById(id);
        if (!farm) {
            return (0, errorHandler_1.default)({
                message: 'Farm not found',
                statusCode: 404,
                req,
                res
            });
        }
        if (status === 'approved') {
            const user = yield user_model_1.default.findById(farm.user);
            farm.status = 'approved';
            yield user_model_1.default.findByIdAndUpdate(farm.user, {
                $inc: { greenPoints: req.body.greenPoints },
                $push: {
                    greenPointsHistory: {
                        points: req.body.greenPoints,
                        type: 'credit',
                        reason: 'Farm approved',
                        createdAt: new Date()
                    }
                }
            });
            const token = (user === null || user === void 0 ? void 0 : user.firebaseToken) || '';
            yield (0, firebase_1.sentPushNotification)(token, `Farm Approved`, `Congratulations! You have earned ${req.body.greenPoints} green points for your Farm approval.`, user === null || user === void 0 ? void 0 : user._id.toString(), req.body.greenPoints.toString());
        }
        else if (status === 'rejected') {
            farm.status = 'rejected';
        }
        yield farm.save();
        return (0, successHandler_1.default)({
            res,
            data: farm,
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
exports.approveRejectFarm = approveRejectFarm;
