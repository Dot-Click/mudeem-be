# Implementing Subscriptions in Flutter

This guide outlines how to implement the in-app subscription flow for the **Mudeem** mobile application using Flutter. It covers the interaction with the backend we just completed and the integration with the `in_app_purchase` package.

## 1. Prerequisites

Add the required packages to your `pubspec.yaml`:
```yaml
dependencies:
  flutter:
    sdk: flutter
  in_app_purchase: ^3.1.13 # Or the latest version
  http: ^1.1.0 # Or your HTTP client of choice (dio, etc.)
```

Ensure you have configured your products in the **App Store Connect** and **Google Play Console**.
For our backend, the product IDs must align with our subscription types:
- `sustainbuddy_gpt`
- `content_creator`

## 2. Initialization and Fetching Products

When your app starts, or when the user navigates to the subscription page, you need to initialize the `InAppPurchase` instance and fetch the available products.

```dart
import 'package:in_app_purchase/in_app_purchase.dart';

class SubscriptionService {
  final InAppPurchase _iap = InAppPurchase.instance;
  bool _isAvailable = false;
  List<ProductDetails> _products = [];
  
  // Replace these with your actual App Store / Play Store Product IDs
  final Set<String> _kIds = {'sustainbuddy_gpt_monthly', 'content_creator_yearly'};

  Future<void> initStoreInfo() async {
    final bool isAvailable = await _iap.isAvailable();
    if (!isAvailable) {
      _isAvailable = isAvailable;
      _products = [];
      return;
    }

    final ProductDetailsResponse response = await _iap.queryProductDetails(_kIds);
    if (response.notFoundIDs.isNotEmpty) {
      // Handle missing products
    }
    _products = response.productDetails;
    _isAvailable = true;
  }
}
```

## 3. Listening to Purchase Updates

You must listen to the `purchaseStream` immediately when the app starts. This stream delivers purchase updates (success, pending, error).

```dart
import 'dart:async';

class SubscriptionService {
  StreamSubscription<List<PurchaseDetails>>? _subscription;

  void listenToPurchases() {
    final Stream<List<PurchaseDetails>> purchaseUpdated = _iap.purchaseStream;
    _subscription = purchaseUpdated.listen((purchaseDetailsList) {
      _listenToPurchaseUpdated(purchaseDetailsList);
    }, onDone: () {
      _subscription?.cancel();
    }, onError: (error) {
      // Handle error
    });
  }

  void _listenToPurchaseUpdated(List<PurchaseDetails> purchaseDetailsList) async {
    for (var purchaseDetails in purchaseDetailsList) {
      if (purchaseDetails.status == PurchaseStatus.pending) {
        // Show loading indicator
      } else {
        if (purchaseDetails.status == PurchaseStatus.error) {
          // Handle error
        } else if (purchaseDetails.status == PurchaseStatus.purchased ||
                   purchaseDetails.status == PurchaseStatus.restored) {
          
          // VERY IMPORTANT: Verify the purchase with our backend
          await _verifyPurchaseWithBackend(purchaseDetails);
        }

        if (purchaseDetails.pendingCompletePurchase) {
          await _iap.completePurchase(purchaseDetails);
        }
      }
    }
  }
}
```

## 4. Making a Purchase

When a user taps the "Subscribe" button for a chosen product:

```dart
Future<void> buySubscription(ProductDetails productDetails) async {
  final PurchaseParam purchaseParam = PurchaseParam(productDetails: productDetails);
  // Using buyNonConsumable since it's a subscription (handled similarly in IAP package)
  await _iap.buyNonConsumable(purchaseParam: purchaseParam);
}
```

## 5. Verifying with the Backend

Once the purchase is successful on the device, you **MUST** send the receipt to our backend `POST /verify` endpoint.

```dart
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'dart:io' show Platform;

Future<void> _verifyPurchaseWithBackend(PurchaseDetails purchaseDetails) async {
  // Determine Platform
  String platform = Platform.isIOS ? 'apple_store' : 'google_play';
  
  // Determine Type based on the Product ID
  String type = 'sustainbuddy_gpt'; 
  if (purchaseDetails.productID.contains('content_creator')) {
    type = 'content_creator';
  }

  final response = await http.post(
    Uri.parse('https://your-api-url.com/api/v1/subscription/verify'),
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer YOUR_USER_TOKEN'
    },
    body: jsonEncode({
      'platform': platform,
      // The receipt/token from the store
      'receipt': purchaseDetails.verificationData.serverVerificationData,
      'type': type
    }),
  );

  if (response.statusCode == 200) {
    // Subscription verified successfully, unlock premium features locally
  } else {
    // Verification failed, show error
  }
}
```

## 6. Real-Time Updates (Webhooks)

Our backend handles webhooks at `/webhook/apple` and `/webhook/google`.
- You do **not** need to call these endpoints from the Flutter app. Let Apple and Google call them directly. 
- You simply need to rely on `GET /my-subscriptions` or `GET /status` whenever the user opens the app to refresh their status locally, ensuring that if it renewed or cancelled in the background, the app UI reflects the latest truth.

```dart
Future<void> checkStatusOnStartup() async {
  final response = await http.get(
    Uri.parse('https://your-api-url.com/api/v1/subscription/my-subscriptions'),
    headers: { 'Authorization': 'Bearer YOUR_USER_TOKEN' },
  );
  
  if (response.statusCode == 200) {
    final data = jsonDecode(response.body)['data'];
    bool hasSustainBuddy = data['sustainbuddyGPT']['active'];
    bool hasContentCreator = data['contentCreator']['active'];
    
    // Update local state block UI accordingly
  }
}
```

## 7. App Store / Play Store Settings
- **iOS:** Setup "Server-to-Server Notifications V2" in App Store Connect. Point the URL to your production server `https://your-api-url.com/api/v1/subscription/webhook/apple`.
- **Android:** Enable "Real-time developer notifications" in the Google Play Console, linked to a Google Cloud Pub/Sub topic, which forwards to `https://your-api-url.com/api/v1/subscription/webhook/google`.
