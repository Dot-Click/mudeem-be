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
        let matchStage = {};
        if (type === 'today') {
            matchStage = {
                'greenPointsHistory.date': {
                    $gte: new Date(new Date().setHours(0, 0, 0, 0)),
                    $lt: new Date(new Date().setHours(23, 59, 59, 999))
                }
            };
        }
        else if (type === 'week') {
            matchStage = {
                ' .date': {
                    $gte: new Date(new Date().setDate(new Date().getDate() - 7)).setHours(0, 0, 0, 0)
                }
            };
        }
        else {
            matchStage = {};
        }
        const data = yield user_model_1.default.aggregate([
            {
                $unwind: '$greenPointsHistory'
            },
            {
                $match: matchStage
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
            {
                $sort: { points: -1 }
            }
        ]);
        return (0, successHandler_1.default)({
            res,
            data,
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
        ]); // get all users and their greenPoints
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
