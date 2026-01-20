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
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyGooglePlaySubscription = void 0;
const googleapis_1 = require("googleapis");
const google_auth_library_1 = require("google-auth-library");
const verifyGooglePlaySubscription = (receipt) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        // Initialize Google Play Developer API client
        const auth = new google_auth_library_1.JWT({
            email: process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_EMAIL,
            key: (_a = process.env.GOOGLE_PLAY_PRIVATE_KEY) === null || _a === void 0 ? void 0 : _a.replace(/\\n/g, '\n'),
            scopes: ['https://www.googleapis.com/auth/androidpublisher']
        });
        const androidPublisher = googleapis_1.google.androidpublisher({
            version: 'v3',
            auth
        });
        // Verify the subscription
        const response = yield androidPublisher.purchases.subscriptions.get({
            packageName: process.env.GOOGLE_PLAY_PACKAGE_NAME || '',
            subscriptionId: receipt,
            token: receipt
        });
        const subscription = response.data;
        // Check subscription status
        const now = new Date().getTime();
        const expiryTime = parseInt(subscription.expiryTimeMillis || '0');
        const startTime = parseInt(subscription.startTimeMillis || '0');
        const autoRenewing = subscription.autoRenewing || false;
        let status = 'pending';
        if (subscription.cancelReason) {
            status = 'cancelled';
        }
        else if (expiryTime < now) {
            status = 'expired';
        }
        else if (subscription.paymentState === 1) {
            status = 'active';
        }
        return {
            isValid: true,
            status,
            subscriptionId: receipt,
            startDate: new Date(startTime),
            endDate: new Date(expiryTime),
            autoRenew: autoRenewing
        };
    }
    catch (error) {
        console.error('Google Play subscription verification error:', error);
        return {
            isValid: false,
            status: 'expired',
            subscriptionId: receipt,
            startDate: new Date(),
            endDate: new Date(),
            autoRenew: false
        };
    }
});
exports.verifyGooglePlaySubscription = verifyGooglePlaySubscription;
