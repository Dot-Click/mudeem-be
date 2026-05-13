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
exports.getRevenueCatUserStatus = void 0;
const axios_1 = __importDefault(require("axios"));
const subscription_config_1 = require("../config/subscription.config");
const getRevenueCatUserStatus = (appUserId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const response = yield axios_1.default.get(`https://api.revenuecat.com/v1/subscribers/${appUserId}`, {
            headers: {
                'Authorization': `Bearer ${process.env.REVENUECAT_SECRET_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });
        const subscriber = response.data.subscriber;
        const activeSubscriptions = [];
        for (const [entId, data] of Object.entries(subscriber.entitlements)) {
            const type = subscription_config_1.MAP_ENTITLEMENT_TO_TYPE[entId];
            if (type) {
                const expiresDate = data.expires_date ? new Date(data.expires_date) : null;
                const isExpired = expiresDate ? expiresDate.getTime() < Date.now() : false;
                if (!isExpired) {
                    const originalTransactionId = ((_a = subscriber.subscriptions[data.product_identifier]) === null || _a === void 0 ? void 0 : _a.original_transaction_id) || null;
                    activeSubscriptions.push({
                        type,
                        entitlementId: entId,
                        expiresDate,
                        purchaseDate: new Date(data.purchase_date),
                        productId: data.product_identifier,
                        originalTransactionId
                    });
                }
            }
        }
        return {
            subscriber,
            activeSubscriptions
        };
    }
    catch (error) {
        console.error('RevenueCat API error:', error);
        throw error;
    }
});
exports.getRevenueCatUserStatus = getRevenueCatUserStatus;
