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
const APPLE_PRODUCTION_URL = 'https://buy.itunes.apple.com/verifyReceipt';
const APPLE_SANDBOX_URL = 'https://sandbox.itunes.apple.com/verifyReceipt';
/** Apple's code for "this is a sandbox receipt, retry against sandbox". */
const SANDBOX_RECEIPT_STATUS = 21007;
/**
 * Posts a receipt to Apple, always trying production first.
 *
 * Apple's documented requirement: verify against production, and only if the
 * response is 21007 retry against sandbox. Choosing the endpoint from NODE_ENV
 * instead breaks App Review, whose testers buy with sandbox accounts against
 * the production backend — every one of those receipts would be rejected.
 */
const postReceipt = (receipt) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const body = {
        'receipt-data': receipt,
        password: process.env.APPLE_SHARED_SECRET,
        'exclude-old-transactions': true
    };
    const production = yield axios_1.default.post(APPLE_PRODUCTION_URL, body);
    if (((_a = production.data) === null || _a === void 0 ? void 0 : _a.status) === SANDBOX_RECEIPT_STATUS) {
        const sandbox = yield axios_1.default.post(APPLE_SANDBOX_URL, body);
        return sandbox.data;
    }
    return production.data;
});
const verifyAppleSubscription = (receipt) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!process.env.APPLE_SHARED_SECRET) {
            throw new Error('APPLE_SHARED_SECRET is not configured — direct Apple verification is unavailable');
        }
        const data = yield postReceipt(receipt);
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
        // Apple does not guarantee the order of latest_receipt_info, so pick the
        // entry that actually expires last rather than trusting index 0.
        const entries = Array.isArray(data.latest_receipt_info)
            ? data.latest_receipt_info
            : [];
        const latestReceipt = entries.reduce((latest, entry) => {
            const entryExpiry = parseInt(entry.expires_date_ms || '0', 10);
            const latestExpiry = parseInt((latest === null || latest === void 0 ? void 0 : latest.expires_date_ms) || '0', 10);
            return entryExpiry > latestExpiry ? entry : latest;
        }, undefined);
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
        // Being inside a trial says nothing about whether auto-renew is on.
        const isAutoRenewing = latestReceipt.auto_renew_status === 'true';
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
