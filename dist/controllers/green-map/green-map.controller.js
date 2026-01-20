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
exports.rewardGreenMap = exports.deleteGreenMap = exports.updateGreenMap = exports.getGreenMap = exports.getAllGreenMaps = exports.createGreenMap = void 0;
const errorHandler_1 = __importDefault(require("../../utils/errorHandler"));
const successHandler_1 = __importDefault(require("../../utils/successHandler"));
const green_map_model_1 = __importDefault(require("../../models/green-map/green-map.model"));
const user_model_1 = __importDefault(require("../../models/user/user.model"));
const firebase_1 = require("../../utils/firebase");
const createGreenMap = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // #swagger.tags = ['green-map']
    try {
        // Logic to create a green map
        const { description, location, coordinates, category, greenPointsPerTime
        // timeLimit
         } = req.body;
        const greenMap = yield green_map_model_1.default.create({
            description,
            location,
            coordinates,
            category,
            greenPointsPerTime
            // timeLimit
        });
        return (0, successHandler_1.default)({
            res,
            data: greenMap,
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
exports.createGreenMap = createGreenMap;
const getAllGreenMaps = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // #swagger.tags = ['green-map']
    try {
        const { page = 0, limit = 10 } = req.query;
        const skip = Number(page) * Number(limit);
        const filter = {};
        req.query.search &&
            (filter['name'] = { $regex: String(req.query.search), $options: 'i' });
        req.query.category && (filter['category'] = String(req.query.category));
        const greenMaps = yield green_map_model_1.default.find(filter)
            .skip(skip)
            .limit(Number(limit));
        return (0, successHandler_1.default)({
            res,
            data: greenMaps,
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
exports.getAllGreenMaps = getAllGreenMaps;
const getGreenMap = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // #swagger.tags = ['green-map']
    try {
        const { id } = req.params;
        const greenMap = yield green_map_model_1.default.findById(id);
        if (!greenMap) {
            return (0, errorHandler_1.default)({
                message: 'Green map not found',
                statusCode: 404,
                req,
                res
            });
        }
        return (0, successHandler_1.default)({
            res,
            data: greenMap,
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
exports.getGreenMap = getGreenMap;
const updateGreenMap = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // #swagger.tags = ['green-map']
    try {
        const { id } = req.params;
        const greenMap = yield green_map_model_1.default.findByIdAndUpdate(id, req.body, {
            new: true
        });
        return (0, successHandler_1.default)({
            res,
            data: greenMap,
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
exports.updateGreenMap = updateGreenMap;
const deleteGreenMap = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // #swagger.tags = ['green-map']
    try {
        const { id } = req.params;
        yield green_map_model_1.default.findByIdAndDelete(id);
        return (0, successHandler_1.default)({
            res,
            data: 'Green map deleted successfully',
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
exports.deleteGreenMap = deleteGreenMap;
const rewardGreenMap = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    // #swagger.tags = ['green-map']
    try {
        const { id } = req.params;
        const greenMap = yield green_map_model_1.default.findById(id);
        if (!greenMap) {
            return (0, errorHandler_1.default)({
                message: 'Green map not found',
                statusCode: 404,
                req,
                res
            });
        }
        const user = yield user_model_1.default.findById((_a = req.user) === null || _a === void 0 ? void 0 : _a._id);
        if (!user) {
            return (0, errorHandler_1.default)({
                message: 'User not found',
                statusCode: 404,
                req,
                res
            });
        }
        const greenMapGreenPoints = greenMap.greenPointsPerTime || 0;
        yield user_model_1.default.updateOne({ _id: (_b = req.user) === null || _b === void 0 ? void 0 : _b._id }, {
            $inc: { greenPoints: greenMapGreenPoints },
            $push: {
                greenPointsHistory: {
                    points: greenMapGreenPoints || 0,
                    reason: "Green Map",
                    type: "credit",
                    date: new Date()
                }
            }
        });
        const userToken = (user === null || user === void 0 ? void 0 : user.firebaseToken) || '';
        yield (0, firebase_1.sentPushNotification)(userToken, `Green Map accepted`, `Congratulations! You have earned ${greenMapGreenPoints} green points for Green Map.`, user === null || user === void 0 ? void 0 : user._id.toString(), greenMapGreenPoints.toString());
        return (0, successHandler_1.default)({
            res,
            data: 'Green map rewarded successfully',
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
exports.rewardGreenMap = rewardGreenMap;
