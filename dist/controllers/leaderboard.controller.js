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
exports.getLeaderboardById = exports.getLeaderboard = void 0;
const user_model_1 = __importDefault(require("../models/user/user.model"));
const successHandler_1 = __importDefault(require("../utils/successHandler"));
const errorHandler_1 = __importDefault(require("../utils/errorHandler"));
const getLeaderboard = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // #swagger.tags = ['leaderboard']
    try {
        const { type } = req.query;
        // type: all, today, week
        let data;
        if (type === 'today') {
            const startOfDay = new Date(new Date().setHours(0, 0, 0, 0));
            const endOfDay = new Date(new Date().setHours(23, 59, 59, 999));
            data = yield user_model_1.default.aggregate([
                {
                    $match: {
                        role: { $ne: 'admin' },
                        isActive: { $ne: false }
                    }
                },
                { $unwind: '$greenPointsHistory' },
                {
                    $match: {
                        'greenPointsHistory.date': { $gte: startOfDay, $lt: endOfDay }
                    }
                },
                {
                    $group: {
                        _id: '$_id',
                        name: { $first: '$name' },
                        email: { $first: '$email' },
                        phone: { $first: '$phone' },
                        profilePicture: { $first: '$profilePicture' },
                        points: { $sum: '$greenPointsHistory.points' }
                    }
                },
                { $sort: { points: -1 } }
            ]);
        }
        else if (type === 'week') {
            const startOfWeek = new Date(new Date().setDate(new Date().getDate() - 7));
            startOfWeek.setHours(0, 0, 0, 0);
            data = yield user_model_1.default.aggregate([
                {
                    $match: {
                        role: { $ne: 'admin' },
                        isActive: { $ne: false }
                    }
                },
                { $unwind: '$greenPointsHistory' },
                {
                    $match: {
                        'greenPointsHistory.date': { $gte: startOfWeek }
                    }
                },
                {
                    $group: {
                        _id: '$_id',
                        name: { $first: '$name' },
                        email: { $first: '$email' },
                        phone: { $first: '$phone' },
                        profilePicture: { $first: '$profilePicture' },
                        points: { $sum: '$greenPointsHistory.points' }
                    }
                },
                { $sort: { points: -1 } }
            ]);
        }
        else {
            data = yield user_model_1.default.aggregate([
                {
                    $match: {
                        role: { $ne: 'admin' },
                        isActive: { $ne: false }
                    }
                },
                {
                    $project: {
                        _id: 1,
                        name: 1,
                        email: 1,
                        phone: 1,
                        profilePicture: 1,
                        points: { $ifNull: ['$greenPoints', 0] }
                    }
                },
                { $sort: { points: -1, name: 1 } }
            ]);
        }
        return (0, successHandler_1.default)({
            res,
            data: data || [],
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
exports.getLeaderboard = getLeaderboard;
const getLeaderboardById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // #swagger.tags = ['leaderboard']
    // we have user id, we need to get the rank of user by greenPoints
    // include the greenPointsHistory of the user
    try {
        const { id } = req.params;
        const user = yield user_model_1.default.findById(id);
        if (!user) {
            return (0, errorHandler_1.default)({
                message: 'User not found',
                statusCode: 404,
                req,
                res
            });
        }
        const data = yield user_model_1.default.aggregate([
            {
                $match: {
                    role: { $ne: 'admin' },
                    isActive: { $ne: false }
                }
            },
            {
                $unwind: '$greenPointsHistory'
            },
            {
                $group: {
                    _id: '$_id',
                    name: { $first: '$name' },
                    profilePicture: { $first: '$profilePicture' },
                    points: { $sum: '$greenPointsHistory.points' }
                }
            },
            {
                $sort: { points: -1 }
            }
        ]); // get all non-admin users and their greenPoints
        const rank = data.findIndex((item) => item._id.toString() === id);
        return (0, successHandler_1.default)({
            res,
            data: Object.assign(Object.assign({}, user.toJSON()), { rank: rank + 1 }),
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
exports.getLeaderboardById = getLeaderboardById;
