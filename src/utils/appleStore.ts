import axios from 'axios';

interface VerificationResult {
    isValid: boolean;
    status: 'active' | 'cancelled' | 'expired' | 'pending';
    subscriptionId: string;
    startDate: Date;
    endDate: Date;
    autoRenew: boolean;
}

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
const postReceipt = async (receipt: string) => {
    const body = {
        'receipt-data': receipt,
        password: process.env.APPLE_SHARED_SECRET,
        'exclude-old-transactions': true
    };

    const production = await axios.post(APPLE_PRODUCTION_URL, body);
    if (production.data?.status === SANDBOX_RECEIPT_STATUS) {
        const sandbox = await axios.post(APPLE_SANDBOX_URL, body);
        return sandbox.data;
    }
    return production.data;
};

export const verifyAppleSubscription = async (
    receipt: string
): Promise<VerificationResult> => {
    try {
        if (!process.env.APPLE_SHARED_SECRET) {
            throw new Error(
                'APPLE_SHARED_SECRET is not configured — direct Apple verification is unavailable'
            );
        }

        const data = await postReceipt(receipt);

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
        const entries: Array<Record<string, string>> = Array.isArray(data.latest_receipt_info)
            ? data.latest_receipt_info
            : [];
        const latestReceipt = entries.reduce<Record<string, string> | undefined>(
            (latest, entry) => {
                const entryExpiry = parseInt(entry.expires_date_ms || '0', 10);
                const latestExpiry = parseInt(latest?.expires_date_ms || '0', 10);
                return entryExpiry > latestExpiry ? entry : latest;
            },
            undefined
        );
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

        let status: 'active' | 'cancelled' | 'expired' | 'pending' = 'pending';

        if (expiresDate < now) {
            status = 'expired';
        } else if (latestReceipt.cancellation_date) {
            status = 'cancelled';
        } else {
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
    } catch (error) {
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
}; 