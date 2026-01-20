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
exports.getAllPools = exports.startRide = exports.myPool = exports.endRide = exports.updatePool = exports.deletePool = exports.getPoolById = exports.getPools = exports.createPool = void 0;
const errorHandler_1 = __importDefault(require("../../utils/errorHandler"));
const successHandler_1 = __importDefault(require("../../utils/successHandler"));
const pool_1 = __importDefault(require("../../models/carpooling/pool"));
const mongoose_1 = __importDefault(require("mongoose"));
const user_model_1 = __importDefault(require("../../models/user/user.model"));
const settings_1 = require("../../models/settings");
const firebase_1 = require("../../utils/firebase");
// done.
const createPool = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    // #swagger.tags = ['carpooling']
    try {
        const { pickupLocation, whereTo, time, availableSeats } = req.body;
        const isPoolCreated = yield pool_1.default.find({
            user: (_a = req.user) === null || _a === void 0 ? void 0 : _a.id,
            rideEnded: false
        });
        console.log('Selceted pool', isPoolCreated);
        if (isPoolCreated.length > 0) {
            return (0, errorHandler_1.default)({
                message: "Can't create more than one pool.",
                statusCode: 500,
                req,
                res
            });
        }
        const pool = yield pool_1.default.create({
            pickupLocation,
            whereTo,
            time,
            availableSeats,
            user: (_b = req.user) === null || _b === void 0 ? void 0 : _b.id,
            existingUsers: []
        });
        return (0, successHandler_1.default)({
            res,
            data: { pool },
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
exports.createPool = createPool;
// done.
const getPools = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    // #swagger.tags = ['carpooling']
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        console.log(userId);
        const allPools = yield pool_1.default.find({
            rideEnded: false,
            user: { $ne: new mongoose_1.default.Types.ObjectId(userId) },
            rideStarted: false
        })
            .populate('user', false)
            .exec();
        return (0, successHandler_1.default)({
            res,
            data: allPools,
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
exports.getPools = getPools;
const myPool = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    // done.
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        console.log('Selceted pool', req.query.rideEnded);
        if (req.query.rideEnded !== undefined) {
            let filters = {};
            filters.rideEnded = req.query.rideEnded === 'true';
            filters.user = userId;
            // filters.rideStarted = false;
            const selectedPools = yield pool_1.default.find(filters)
                .populate('existingUsers', false)
                .exec();
            if (!selectedPools) {
                return (0, errorHandler_1.default)({
                    message: 'Pool not found.',
                    statusCode: 404,
                    req,
                    res
                });
            }
            return (0, successHandler_1.default)({
                res,
                data: selectedPools,
                statusCode: 200
            });
        }
        const allPools = yield pool_1.default.find({ user: userId })
            .populate('existingUsers', false)
            .exec();
        return (0, successHandler_1.default)({
            res,
            data: allPools,
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
exports.myPool = myPool;
const getPoolById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // #swagger.tags = ['carpooling']
    try {
        const id = req.params.id;
        const selectedPool = yield pool_1.default.findById(id)
            .populate('existingUsers', false)
            .exec();
        if (!selectedPool) {
            return (0, errorHandler_1.default)({
                message: 'Pool not found.',
                statusCode: 500,
                req,
                res
            });
        }
        return (0, successHandler_1.default)({
            res,
            data: selectedPool,
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
exports.getPoolById = getPoolById;
const deletePool = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // #swagger.tags = ['carpooling']
    try {
        const id = req.params.id;
        if (!id) {
            return (0, errorHandler_1.default)({
                message: "Id can't be empty.",
                statusCode: 400,
                req,
                res
            });
        }
        const alue = yield pool_1.default.findByIdAndDelete(id);
        if (!alue) {
            return (0, successHandler_1.default)({
                res,
                data: 'Pool already deleted successfully',
                statusCode: 201
            });
        }
        return (0, successHandler_1.default)({
            res,
            data: 'Pool deleted successfully',
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
exports.deletePool = deletePool;
const updatePool = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // #swagger.tags = ['carpooling']
        const { pickupLocation, whereTo, time, availableSeats, userIdToAdd, userIdToDropOff, rideStarted } = req.body;
        const poolId = req.params.id;
        var foundPool = yield pool_1.default.findById(poolId);
        if (!foundPool) {
            return (0, errorHandler_1.default)({
                message: 'Pool not found.',
                statusCode: 404,
                req,
                res
            });
        }
        const newUpdatedPool = foundPool;
        // drop
        if (userIdToDropOff) {
            const doesDroppingOffUserExist = foundPool.droppedOffUsers.find((element) => element.toString() === userIdToDropOff.toString());
            if (doesDroppingOffUserExist) {
                return (0, errorHandler_1.default)({
                    message: 'User already dropped off.',
                    statusCode: 400,
                    req,
                    res
                });
            }
            else {
                const userIndexInExisting = foundPool.existingUsers.findIndex((element) => element.toString() === userIdToDropOff.toString());
                if (userIndexInExisting === -1) {
                    return (0, errorHandler_1.default)({
                        message: 'User is not in the ride.',
                        statusCode: 400,
                        req,
                        res
                    });
                }
                newUpdatedPool.existingUsers.splice(userIndexInExisting, 1);
                newUpdatedPool.droppedOffUsers.push(userIdToDropOff);
                // Increase  seats when a user is dropped off
                newUpdatedPool.availableSeats += 1;
            }
        }
        // add
        if (userIdToAdd) {
            const doesDroppingOffUserExist = foundPool.existingUsers.find((element) => element.toString() === userIdToAdd.toString());
            if (doesDroppingOffUserExist) {
                return (0, errorHandler_1.default)({
                    message: 'User already in the pool.',
                    statusCode: 400,
                    req,
                    res
                });
            }
            else {
                var isPoolFull = foundPool.availableSeats === 0;
                if (isPoolFull) {
                    return (0, errorHandler_1.default)({
                        message: 'Pool is full.',
                        statusCode: 400,
                        req,
                        res
                    });
                }
                // Allow the user to join
                newUpdatedPool.existingUsers.push(userIdToAdd);
                newUpdatedPool.availableSeats -= 1; // Decrease seat count
            }
        }
        if (foundPool.rideStarted === false) {
            if (availableSeats)
                newUpdatedPool.availableSeats = availableSeats;
            if (pickupLocation)
                newUpdatedPool.pickupLocation = pickupLocation;
            if (whereTo)
                newUpdatedPool.whereTo = whereTo;
            if (time)
                newUpdatedPool.time = time;
        }
        if (rideStarted)
            newUpdatedPool.rideStarted = true;
        yield newUpdatedPool.save();
        return (0, successHandler_1.default)({
            res,
            data: newUpdatedPool,
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
exports.updatePool = updatePool;
const endRide = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    // #swagger.tags = ['carpooling']
    try {
        const id = req.params.id;
        const pool = yield pool_1.default.findById(id).populate('user', false);
        if (!pool) {
            return (0, errorHandler_1.default)({
                message: 'Pool not found.',
                statusCode: 404,
                req,
                res
            });
        }
        // Move existing users to droppedOffUsers if they are not already there
        pool.existingUsers.forEach((user) => {
            if (!pool.droppedOffUsers.includes(user)) {
                pool.droppedOffUsers.push(user);
            }
        });
        // Clear existing users
        pool.existingUsers = [];
        // Mark the ride as ended
        pool.rideEnded = true;
        yield pool.save();
        const setting = yield settings_1.Setting.findOne().sort({ createdAt: -1 });
        if (!setting) {
            throw new Error('Settings not found');
        }
        let userRideOwnerPoints = 0;
        var greenPointsHistoryForResponse = {
            points: userRideOwnerPoints,
            type: 'credit',
            reason: 'carpooling'
        };
        const carPoolingGreenPoints = Number(setting.carPoolingGreenPoints || 0);
        greenPointsHistoryForResponse.points = carPoolingGreenPoints;
        const user = req.user;
        const userToken = (user === null || user === void 0 ? void 0 : user.firebaseToken) || '';
        yield user_model_1.default.updateOne({ _id: (_a = req.user) === null || _a === void 0 ? void 0 : _a._id }, {
            $inc: { greenPoints: carPoolingGreenPoints },
            $push: {
                greenPointsHistory: {
                    points: carPoolingGreenPoints || 0,
                    reason: "Lift",
                    type: "credit",
                    date: new Date()
                }
            }
        });
        yield (0, firebase_1.sentPushNotification)(userToken, `Lift accepted`, `Congratulations! You have earned ${carPoolingGreenPoints} green points for Lift.`, user === null || user === void 0 ? void 0 : user._id.toString(), carPoolingGreenPoints.toString());
        const points = carPoolingGreenPoints / 4;
        const rideOwnerPoints = Math.floor(points);
        const userPoints = Math.floor(points);
        greenPointsHistoryForResponse.points = rideOwnerPoints;
        const userTotalPoints = (user.greenPoints || 0) + userPoints;
        yield user_model_1.default.updateOne({ _id: user._id }, {
            $set: {
                greenPoints: userTotalPoints
            },
            $push: {
                greenPointsHistory: {
                    points: userPoints,
                    reason: "Lift",
                    type: "credit",
                    date: new Date()
                }
            }
        });
        return (0, successHandler_1.default)({
            res,
            data: greenPointsHistoryForResponse,
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
exports.endRide = endRide;
const startRide = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // #swagger.tags = ['carpooling']
    try {
        const id = req.params.id;
        const pool = yield pool_1.default.findById(id);
        if (!pool) {
            return (0, errorHandler_1.default)({
                message: 'Pool not found.',
                statusCode: 500,
                req,
                res
            });
        }
        pool.rideStarted = true;
        yield pool.save();
        return (0, successHandler_1.default)({
            res,
            data: pool,
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
exports.startRide = startRide;
const getAllPools = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // #swagger.tags = ['carpooling']
    try {
        const allPools = yield pool_1.default.find().populate('user', false).exec();
        return (0, successHandler_1.default)({
            res,
            data: allPools,
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
exports.getAllPools = getAllPools;
