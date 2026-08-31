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
exports.sendNotificationFromAdmin = exports.fetchNotificationForAdmin = exports.updateSeenNotification = exports.fetchNotification = void 0;
const errorHandler_1 = __importDefault(require("../../utils/errorHandler"));
const successHandler_1 = __importDefault(require("../../utils/successHandler"));
const user_model_1 = __importDefault(require("../../models/user/user.model"));
const notifications_model_1 = __importDefault(require("../../models/notifications/notifications_model"));
const mongoose_1 = __importDefault(require("mongoose"));
const firebase_1 = require("../../utils/firebase");
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
    var _a, _b;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        const userRole = (_b = req.user) === null || _b === void 0 ? void 0 : _b.role;
        const { notificationId } = req.body || {};
        let query = {};
        if (notificationId) {
            query = { _id: notificationId };
        }
        else if (userRole === 'admin') {
            // Admin marks all notifications as seen
            query = {};
        }
        else if (userId) {
            query = { user: new mongoose_1.default.Types.ObjectId(userId) };
        }
        const notification = yield notifications_model_1.default.updateMany(query, { $set: { seen: true } });
        return (0, successHandler_1.default)({
            data: notification,
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
exports.updateSeenNotification = updateSeenNotification;
const fetchNotificationForAdmin = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const notification = yield notifications_model_1.default.find()
            .populate({
            path: 'user',
            select: 'name email profilePicture'
        })
            .sort({ createdAt: -1 });
        return (0, successHandler_1.default)({
            data: notification || [],
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
exports.fetchNotificationForAdmin = fetchNotificationForAdmin;
const sendNotificationFromAdmin = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { title, content, message, target = 'all', userId, points = '0' } = req.body;
        const bodyContent = String(content || message || '').trim();
        const notificationTitle = String(title || '').trim();
        if (!notificationTitle || !bodyContent) {
            return (0, errorHandler_1.default)({
                message: 'Title and message/content are required',
                statusCode: 400,
                req,
                res
            });
        }
        let query = {};
        if (target === 'users') {
            query = { role: 'user' };
        }
        else if (target === 'vendors') {
            query = { role: 'vendor' };
        }
        else if (target === 'admins') {
            query = { role: 'admin' };
        }
        else if (target === 'specific' && userId) {
            query = { _id: userId };
        }
        else {
            query = {}; // all users
        }
        const targetUsers = yield user_model_1.default.find(query).select('_id name email firebaseToken');
        if (!targetUsers || targetUsers.length === 0) {
            return (0, errorHandler_1.default)({
                message: `No recipients found for target group: "${target}". Please check user roles.`,
                statusCode: 400,
                req,
                res
            });
        }
        const numericPoints = Number(points || 0);
        // Create in-app notifications
        const notificationsToInsert = targetUsers.map((u) => ({
            user: u._id,
            title: notificationTitle,
            content: bodyContent,
            points: points,
            seen: false
        }));
        yield notifications_model_1.default.insertMany(notificationsToInsert);
        // If points attached, credit to users' greenPoints and greenPointsHistory
        if (numericPoints > 0) {
            const userIds = targetUsers.map((u) => u._id);
            yield user_model_1.default.updateMany({ _id: { $in: userIds } }, {
                $inc: { greenPoints: numericPoints },
                $push: {
                    greenPointsHistory: {
                        points: numericPoints,
                        reason: `Notification Reward: ${notificationTitle}`,
                        type: 'credit',
                        date: new Date()
                    }
                }
            });
        }
        // Send push notifications via FCM to users with active tokens
        let pushCount = 0;
        for (const u of targetUsers) {
            if (u.firebaseToken && u.firebaseToken !== 'NULL' && u.firebaseToken !== '') {
                try {
                    yield (0, firebase_1.sentPushNotification)(u.firebaseToken, notificationTitle, bodyContent, u._id.toString(), points);
                    pushCount++;
                }
                catch (err) {
                    console.error(`FCM send error for user ${u._id}:`, err);
                }
            }
        }
        return (0, successHandler_1.default)({
            data: {
                totalRecipients: targetUsers.length,
                pushDelivered: pushCount,
                message: `Notification broadcasted to ${targetUsers.length} user(s) (${target}) successfully.`
            },
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
exports.sendNotificationFromAdmin = sendNotificationFromAdmin;
