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
exports.fetchNotificationForAdmin = exports.updateSeenNotification = exports.fetchNotification = void 0;
const errorHandler_1 = __importDefault(require("../../utils/errorHandler"));
const successHandler_1 = __importDefault(require("../../utils/successHandler"));
const notifications_model_1 = __importDefault(require("../../models/notifications/notifications_model"));
const mongoose_1 = __importDefault(require("mongoose"));
const fetchNotification = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        console.log('fetchNotification');
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        const notifications = yield notifications_model_1.default.find({
            user: new mongoose_1.default.Types.ObjectId(userId)
        }).sort({ createdAt: -1 }); // Sort by createdAt in descending order (newest first)
        if (!notifications || notifications.length === 0) {
            return (0, errorHandler_1.default)({
                message: 'Notification not found',
                statusCode: 400,
                req,
                res
            });
        }
        else {
            return (0, successHandler_1.default)({
                data: notifications,
                statusCode: 200,
                res
            });
        }
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
exports.fetchNotification = fetchNotification;
const updateSeenNotification = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        const notification = yield notifications_model_1.default.updateMany({ user: new mongoose_1.default.Types.ObjectId(userId) }, { $set: { seen: true } });
        if (!notification) {
            return (0, errorHandler_1.default)({
                message: 'Notification not found',
                statusCode: 400,
                req,
                res
            });
        }
        else {
            return (0, successHandler_1.default)({
                data: notification,
                statusCode: 200,
                res
            });
        }
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
exports.updateSeenNotification = updateSeenNotification;
const fetchNotificationForAdmin = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const notification = yield notifications_model_1.default.find().populate({
            path: 'user',
            select: 'name email profilePicture'
        });
        if (!notification) {
            return (0, errorHandler_1.default)({
                message: 'Notification not found',
                statusCode: 400,
                req,
                res
            });
        }
        else {
            return (0, successHandler_1.default)({
                data: notification,
                statusCode: 200,
                res
            });
        }
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
exports.fetchNotificationForAdmin = fetchNotificationForAdmin;
