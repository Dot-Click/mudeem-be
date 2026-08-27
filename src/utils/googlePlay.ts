interface VerificationResult {
    isValid: boolean;
    status: 'active' | 'cancelled' | 'expired' | 'pending';
    subscriptionId: string;
    startDate: Date;
    endDate: Date;
    autoRenew: boolean;
}

/**
 * Direct Google Play verification is NOT in use — purchases are verified through
 * RevenueCat (see revenuecat.controller.ts), which also performs the purchase
 * acknowledgement Play requires within 3 days.
 *
 * The previous implementation is in git history. It was removed rather than left
 * in place because it was broken in a way that looked functional:
 *
 *  - it passed the same value as both `subscriptionId` (the product id) and
 *    `token` (the purchase token), which the Play API cannot satisfy;
 *  - it used the v1 `purchases.subscriptions` endpoint, superseded by
 *    `purchases.subscriptionsv2` for products with base plans and offers;
 *  - it never called `acknowledge()`, and Play automatically refunds any
 *    purchase left unacknowledged for 3 days;
 *  - it returned `isValid: true` even for expired subscriptions.
 *
 * To enable it properly: configure GOOGLE_PLAY_SERVICE_ACCOUNT_EMAIL,
 * GOOGLE_PLAY_PRIVATE_KEY and GOOGLE_PLAY_PACKAGE_NAME; change the caller to
 * pass productId and purchaseToken separately; use
 * purchases.subscriptionsv2.get; and acknowledge the purchase on first verify.
 */
export const verifyGooglePlaySubscription = async (
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    receipt: string
): Promise<VerificationResult> => {
    throw new Error(
        'Direct Google Play verification is not enabled. Subscriptions are verified via RevenueCat.'
    );
};
