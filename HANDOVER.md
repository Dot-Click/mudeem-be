# Mudeem — RevenueCat Subscription Integration Handover

## Project Stack
- **Backend:** Node.js + TypeScript + Express + Mongoose — hosted on Railway, proxied via Cloudflare, domain `api.mudeem.ae`
- **Frontend:** Flutter (Android focus), using `purchases_flutter ^10.0.1`
- **Backend repo:** `https://github.com/Dot-Click/mudeem-be` (branch: `main`)
- **Flutter repo:** `https://github.com/anasayub80/mudeem.git` (branch: `master`)
- **Railway URL (active):** `https://mudeem-be-production.up.railway.app`

---

## RevenueCat Configuration
| Key | Value |
|-----|-------|
| Flutter Android SDK key (dotenv) | `goog_MDgVUcwHmdVBSNfSNoMJxSgLfuv` |
| Backend secret key (Railway env) | `sk_fMMtmyfjouSCwqDcYJhZHPADJkxti` |
| Entitlement ID — GPT | `sustainbuddy_gpt_access` |
| Entitlement ID — Content Creator | `content_creator_access` (assumed, unconfirmed — only GPT tested) |
| RC webhook URL (in RC dashboard) | Points to `api.mudeem.ae` — path must be `/subscription/webhook/revenuecat` or `/subscription/webhook` |

Both the Flutter SDK key and the backend secret key are confirmed to be from the **same RC project (Mudeem Play Store)**. ✅

---

## Auth System
- Uses **Passport.js + express-session + MongoStore** (cookie-based, no JWT/auth tokens)
- Session cookie: `secure: true`, `sameSite: 'none'`, stored in MongoDB via `connect-mongo`
- `deserializeUser` fetches a **fresh user from MongoDB on every request** — so any update to `user.subscriptions` is reflected on the very next API call
- Flutter uses `dio` + `cookie_jar` + `CookieManagerCustom` to persist and send session cookies

---

## What Was Fixed In This Session

### Backend fixes (all committed and deployed to Railway)

1. **`src/utils/revenueCat.ts`**
   - Added `timeout: 10000` to axios call (was hanging indefinitely → caused 502s)
   - Added `encodeURIComponent(appUserId)` to URL-encode email in RC API path

2. **`src/config/subscription.config.ts`**
   - Changed `SUSTAINBUDDY_GPT: 'sustainbuddy_gpt_entitlement'` → `'sustainbuddy_gpt_access'`
   - Changed `CONTENT_CREATOR: 'content_creator_entitlement'` → `'content_creator_access'`
   - **This was the primary root cause** — entitlement ID never matched what RC sent, so `activeSubscriptions` was always empty

3. **`src/controllers/subscription/subscription.controller.ts`** — `getUserSubscriptions`
   - Added fallback: if no `Subscription` document found for the user, check `user.subscriptions.sustainbuddyGPT` / `user.subscriptions.contentCreator` flags directly on the User model
   - Needed because sync skips creating Subscription documents when `originalTransactionId` is missing (Android edge case)

### Flutter fixes (all committed and pushed to `master`)

4. **`lib/app_services/api/subscription_api_constants.dart`**
   - Changed `baseUrl` from `'https://api.mudeem.ae/api/subscription'` to `'https://mudeem-be-production.up.railway.app/subscription'`
   - The old URL had a path mismatch (`/api/subscription/` doesn't exist on the backend) and a domain mismatch (cookies stored for Railway domain, requests going to Cloudflare domain)

5. **`lib/app_services/Model/subscription_models.dart`**
   - `SubscriptionModel.fromJson` now reads `startDate`/`endDate` (camelCase) with `start_date`/`end_date` (snake_case) fallback
   - Added `revenueCat('revenue_cat')` to `SubscriptionPlatform` enum

6. **`lib/modules/subscription/subscription_management_state.dart`**
   - Added `PurchaseSuccessEvent`

7. **`lib/modules/subscription/subscription_management_cubit.dart`**
   - Emits `PurchaseSuccessEvent` after successful `upgrade()` flow

8. **`lib/modules/subscription/subscription_management_view.dart`**
   - Handles `PurchaseSuccessEvent` with `AwesomeDialog` success dialog

9. **`assets/i18n/en.json`**
   - Added missing `subscrip` translation keys: `Purchase Successful`, `Your subscription is now active. Enjoy your new features!`, `Awesome`, `Developer mode`

---

## What Is NOT Done Yet (Pending)

### ❌ CRITICAL — Sync guard not committed/deployed
**File:** `src/controllers/subscription/revenuecat.controller.ts` — `syncRevenueCatSubscription`

**The bug:** Sync always initialises `userUpdateData` with both flags set to `false`, then sets them to `true` for each active RC entitlement. If RC returns **zero entitlements** for any reason (transient error, wrong project, user not found), the loop never runs and sync **writes `false` to MongoDB**, destroying previously working GPT access.

**The fix (written but not committed):**
```ts
const hasAnyEntitlement = Object.keys(subscriber.entitlements).length > 0;
if (!hasAnyEntitlement) {
    console.warn(`[RC Sync] No entitlements returned for ${user.email} — skipping update`);
    return SuccessHandler({ res, data: { message: 'No entitlements — user flags unchanged', activeSubscriptions: [] }, statusCode: 200 });
}
```
Add this check immediately after `getRevenueCatUserStatus` returns, before building `userUpdateData`. Then commit and push to Railway.

### ⚠️ Webhook path unverified
The RC dashboard webhook URL points to `api.mudeem.ae`. The backend registers:
- `POST /subscription/webhook/revenuecat`
- `POST /subscription/webhook`

Verify the exact path configured in the RC dashboard matches one of the above. If it's `/api/subscription/webhook/revenuecat` — that path does **not** exist.

### ⚠️ Subscription documents never created (originalTransactionId missing)
`getRevenueCatUserStatus` looks up `originalTransactionId` via:
```ts
subscriber.subscriptions[data.product_identifier]?.original_transaction_id
```
For Android, this lookup may fail if the key format doesn't match. The User model flags still get updated correctly (GPT works), but the `Subscription` collection stays empty. The `/my-subscriptions` fallback patches over this for now. The real fix is to investigate the RC API response structure for Android and fix the `originalTransactionId` lookup.

### ⚠️ iOS RC key
`REVENUECAT_IOS_API_KEY=goog_MDgVUcwHmdVBSNfSNoMJxSgLfuv` in the Flutter `.env` — this is the Android key. Replace with the actual iOS `appl_` key before iOS release.

### ⚠️ Translation keys only added to `en.json`
If the app supports Arabic or other languages, the same keys need to be added to those translation files.

---

## How the Full Subscription Flow Works

```
User taps Subscribe
  → Flutter RC SDK (goog_ key) processes purchase with Google Play
  → RC confirms entitlement: sustainbuddy_gpt_access
  → Flutter calls POST /subscription/sync (Railway URL, with session cookie)
  → Backend: getRevenueCatUserStatus(user.email) via RC REST API (sk_ key)
  → RC returns subscriber with sustainbuddy_gpt_access entitlement
  → Backend maps sustainbuddy_gpt_access → sustainbuddy_gpt (subscription.config.ts)
  → Backend sets user.subscriptions.sustainbuddyGPT = true in MongoDB
  → Flutter calls GET /subscription/my-subscriptions
  → Returns sustainbuddyGPT: true (from Subscription doc OR User model fallback)
  → PurchaseSuccessEvent fires → AwesomeDialog shown
  → GPT feature unlocked (gpt.controller.ts checks req.user.subscriptions.sustainbuddyGPT)

Ongoing (after a month):
  → Google Play renews → RC fires RENEWAL webhook → api.mudeem.ae/subscription/webhook/revenuecat
  → Backend keeps user.subscriptions.sustainbuddyGPT = true

App reopen:
  → syncOnResume() → /sync → re-confirms with RC → re-sets flag if needed
```

---

## Key File Locations

| Concern | File |
|---------|------|
| RC entitlement → type mapping | `src/config/subscription.config.ts` |
| RC API call (axios) | `src/utils/revenueCat.ts` |
| Sync endpoint | `src/controllers/subscription/revenuecat.controller.ts` |
| GPT access gate | `src/controllers/gpt/gpt.controller.ts:14` — checks `req.user.subscriptions.sustainbuddyGPT` |
| Subscription routes | `src/routes/subscription.routes.ts` |
| Flutter API URLs | `lib/app_services/api/subscription_api_constants.dart` |
| Flutter RC SDK key | `lib/app_services/package_helpers/revenuecat_helper.dart` (reads from dotenv) |
| Flutter subscription service | `lib/app_services/api/subscription_service.dart` |
| Flutter subscription cubit | `lib/modules/subscription/subscription_management_cubit.dart` |
| Translation keys | `assets/i18n/en.json` → `subscrip` section |
