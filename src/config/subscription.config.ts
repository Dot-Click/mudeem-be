export const REVENUECAT_ENTITLEMENTS = {
    SUSTAINBUDDY_GPT: 'sustainbuddy_gpt_entitlement',
    CONTENT_CREATOR: 'content_creator_entitlement'
};

export const REVENUECAT_PRODUCTS = {
    SUSTAINBUDDY_GPT_MONTHLY: 'sustainbuddy_gpt_monthly',
    SUSTAINBUDDY_GPT_ANNUAL: 'sustainbuddy_gpt_annual',
    CONTENT_CREATOR_MONTHLY: 'content_creator_monthly',
    CONTENT_CREATOR_ANNUAL: 'content_creator_annual'
};

export const MAP_ENTITLEMENT_TO_TYPE: Record<string, 'sustainbuddy_gpt' | 'content_creator'> = {
    [REVENUECAT_ENTITLEMENTS.SUSTAINBUDDY_GPT]: 'sustainbuddy_gpt',
    [REVENUECAT_ENTITLEMENTS.CONTENT_CREATOR]: 'content_creator'
};
