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
exports.sentPushNotification = void 0;
const firebase_admin_1 = __importDefault(require("firebase-admin"));
const firebase_admin_json_1 = __importDefault(require("../config/firebase-admin.json"));
const notifications_model_1 = __importDefault(require("../models/notifications/notifications_model"));
const mongoose_1 = __importDefault(require("mongoose"));
// Firebase Initialize 
firebase_admin_1.default.initializeApp({
    credential: firebase_admin_1.default.credential.cert(firebase_admin_json_1.default),
});
const sentPushNotification = (token, title, body, userId, points) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("Supposed to send not here", token);
    const message = {
        token: token,
        notification: {
            title: title,
            body: body,
        },
    };
    try {
        console.log("Storing push notification");
        const response = yield firebase_admin_1.default.messaging().send(message);
        if (response) {
            //   Notification.create({ 
            //     title: title,
            //     content: body,
            //     user: token
            // })
            notifications_model_1.default.create({
                user: new mongoose_1.default.Types.ObjectId(userId),
                title: title,
                content: body,
                points: points,
            });
        }
        return true;
    }
    catch (error) {
        console.log("Error sending push notification:", error);
        return false;
    }
});
exports.sentPushNotification = sentPushNotification;
