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
exports.verifyAppleSubscription = void 0;
const axios_1 = __importDefault(require("axios"));
const verifyAppleSubscription = (receipt) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        // Use sandbox URL for testing, production URL for live app
        const verifyUrl = process.env.NODE_ENV === 'production'
            ? 'https://buy.itunes.apple.com/verifyReceipt'
            : 'https://sandbox.itunes.apple.com/verifyReceipt';
        const response = yield axios_1.default.post(verifyUrl, {
            'receipt-data': receipt,
            password: process.env.APPLE_SHARED_SECRET,
            'exclude-old-transactions': true
        });
        const data = response.data;
        // Check if the receipt is valid
        if (data.status !== 0) {
            return {
                isValid: false,
                status: 'expired',
                subscriptionId: receipt,
                startDate: new Date(),
                endDate: new Date(),
                autoRenew: false
            };
        }
        // Get the latest subscription transaction
        const latestReceipt = (_a = data.latest_receipt_info) === null || _a === void 0 ? void 0 : _a[0];
        if (!latestReceipt) {
            return {
                isValid: false,
                status: 'expired',
                subscriptionId: receipt,
                startDate: new Date(),
                endDate: new Date(),
                autoRenew: false
            };
        }
        const now = new Date().getTime();
        const expiresDate = new Date(parseInt(latestReceipt.expires_date_ms)).getTime();
        const purchaseDate = new Date(parseInt(latestReceipt.purchase_date_ms));
        const isAutoRenewing = latestReceipt.is_trial_period === 'true' ||
            latestReceipt.auto_renew_status === 'true';
        let status = 'pending';
        if (expiresDate < now) {
            status = 'expired';
        }
        else if (latestReceipt.cancellation_date) {
            status = 'cancelled';
        }
        else {
            status = 'active';
        }
        return {
            isValid: true,
            status,
            subscriptionId: latestReceipt.transaction_id,
            startDate: purchaseDate,
            endDate: new Date(expiresDate),
            autoRenew: isAutoRenewing
        };
    }
    catch (error) {
        console.error('Apple Store subscription verification error:', error);
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
exports.verifyAppleSubscription = verifyAppleSubscription;
