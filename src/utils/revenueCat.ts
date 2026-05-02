import axios from 'axios';
import { MAP_ENTITLEMENT_TO_TYPE } from '../config/subscription.config';

interface RevenueCatSubscriberInfo {
    entitlements: Record<string, {
        expires_date: string;
        purchase_date: string;
        product_identifier: string;
    }>;
    subscriptions: Record<string, any>;
    original_app_user_id: string;
}

export const getRevenueCatUserStatus = async (appUserId: string) => {
    try {
        const response = await axios.get(`https://api.revenuecat.com/v1/subscribers/${appUserId}`, {
            headers: {
                'Authorization': `Bearer ${process.env.REVENUECAT_SECRET_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        const subscriber: RevenueCatSubscriberInfo = response.data.subscriber;
        const activeSubscriptions: any[] = [];

        for (const [entId, data] of Object.entries(subscriber.entitlements)) {
            const type = MAP_ENTITLEMENT_TO_TYPE[entId];
            if (type) {
                const expiresDate = data.expires_date ? new Date(data.expires_date) : null;
                const isExpired = expiresDate ? expiresDate.getTime() < Date.now() : false;

                if (!isExpired) {
                    activeSubscriptions.push({
                        type,
                        entitlementId: entId,
                        expiresDate,
                        purchaseDate: new Date(data.purchase_date),
                        productId: data.product_identifier
                    });
                }
            }
        }

        return {
            subscriber,
            activeSubscriptions
        };
    } catch (error) {
        console.error('RevenueCat API error:', error);
        throw error;
    }
};
