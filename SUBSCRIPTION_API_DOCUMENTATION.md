# Subscription Module API Documentation

This document provides comprehensive information about the Subscription Module API endpoints for implementing subscription functionality in your Flutter app.

## Base URL
```
https://your-api-domain.com/api/subscription
```

## Authentication
All endpoints (except webhook) require authentication. Include the JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## API Endpoints

### 1. Verify Subscription
**POST** `/verify`

Verifies a subscription purchase from Google Play Store or Apple App Store and creates/updates the subscription record.

#### Request Body
```json
{
  "platform": "google_play" | "apple_store",
  "receipt": "string",
  "type": "sustainbuddy_gpt" | "content_creator"
}
```

#### Request Parameters
- `platform` (required): The platform where the subscription was purchased
  - `google_play`: Google Play Store
  - `apple_store`: Apple App Store
- `receipt` (required): The receipt data from the platform
- `type` (required): The type of subscription
  - `sustainbuddy_gpt`: Access to AI-powered sustainability features
  - `content_creator`: Access to content creation tools

#### Response
```json
{
  "success": true,
  "data": {
    "_id": "subscription_id",
    "user": "user_id",
    "type": "sustainbuddy_gpt",
    "platform": "google_play",
    "status": "active",
    "startDate": "2024-01-01T00:00:00.000Z",
    "endDate": "2024-02-01T00:00:00.000Z",
    "platformSubscriptionId": "platform_subscription_id",
    "autoRenew": true,
    "lastVerifiedAt": "2024-01-01T12:00:00.000Z",
    "createdAt": "2024-01-01T12:00:00.000Z",
    "updatedAt": "2024-01-01T12:00:00.000Z"
  },
  "message": "Subscription verified successfully"
}
```

#### Flutter Implementation Example
```dart
Future<void> verifySubscription({
  required String platform,
  required String receipt,
  required String type,
}) async {
  try {
    final response = await http.post(
      Uri.parse('$baseUrl/subscription/verify'),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
      body: jsonEncode({
        'platform': platform,
        'receipt': receipt,
        'type': type,
      }),
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      // Handle successful subscription verification
      print('Subscription verified: ${data['data']}');
    } else {
      // Handle error
      print('Error: ${response.body}');
    }
  } catch (e) {
    print('Exception: $e');
  }
}
```

### 2. Get User Subscriptions
**GET** `/my-subscriptions`

Retrieves all active subscriptions for the authenticated user.

#### Response
```json
{
  "success": true,
  "data": {
    "sustainbuddyGPT": {
      "active": true,
      "subscription": {
        "_id": "subscription_id",
        "type": "sustainbuddy_gpt",
        "platform": "google_play",
        "status": "active",
        "startDate": "2024-01-01T00:00:00.000Z",
        "endDate": "2024-02-01T00:00:00.000Z",
        "autoRenew": true,
        "lastVerifiedAt": "2024-01-01T12:00:00.000Z"
      }
    },
    "contentCreator": {
      "active": false,
      "subscription": null
    }
  },
  "message": "Subscriptions retrieved successfully"
}
```

#### Flutter Implementation Example
```dart
Future<Map<String, dynamic>> getUserSubscriptions() async {
  try {
    final response = await http.get(
      Uri.parse('$baseUrl/subscription/my-subscriptions'),
      headers: {
        'Authorization': 'Bearer $token',
      },
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      return data['data'];
    } else {
      throw Exception('Failed to load subscriptions');
    }
  } catch (e) {
    throw Exception('Error: $e');
  }
}
```

### 3. Check Subscription Status
**GET** `/status?type=all`

Retrieves detailed subscription status information with optional filtering by type.

#### Query Parameters
- `type` (optional): Filter by subscription type
  - `sustainbuddy_gpt`: Only SustainBuddy GPT subscriptions
  - `content_creator`: Only Content Creator subscriptions
  - `all`: All subscription types (default)

#### Response
```json
{
  "success": true,
  "data": {
    "total": 3,
    "active": 1,
    "cancelled": 1,
    "expired": 1,
    "subscriptions": [
      {
        "id": "subscription_id_1",
        "type": "sustainbuddy_gpt",
        "platform": "google_play",
        "status": "active",
        "startDate": "2024-01-01T00:00:00.000Z",
        "endDate": "2024-02-01T00:00:00.000Z",
        "autoRenew": true,
        "lastVerifiedAt": "2024-01-01T12:00:00.000Z"
      }
    ]
  },
  "message": "Subscription status retrieved successfully"
}
```

#### Flutter Implementation Example
```dart
Future<Map<String, dynamic>> checkSubscriptionStatus({String? type}) async {
  try {
    final queryParams = type != null ? {'type': type} : {};
    final uri = Uri.parse('$baseUrl/subscription/status').replace(queryParameters: queryParams);
    
    final response = await http.get(
      uri,
      headers: {
        'Authorization': 'Bearer $token',
      },
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      return data['data'];
    } else {
      throw Exception('Failed to check subscription status');
    }
  } catch (e) {
    throw Exception('Error: $e');
  }
}
```

### 4. Get Subscription History
**GET** `/history`

Retrieves complete subscription history for the authenticated user.

#### Response
```json
{
  "success": true,
  "data": {
    "total": 5,
    "history": [
      {
        "id": "subscription_id",
        "type": "sustainbuddy_gpt",
        "platform": "google_play",
        "status": "active",
        "startDate": "2024-01-01T00:00:00.000Z",
        "endDate": "2024-02-01T00:00:00.000Z",
        "autoRenew": true,
        "lastVerifiedAt": "2024-01-01T12:00:00.000Z",
        "createdAt": "2024-01-01T12:00:00.000Z",
        "updatedAt": "2024-01-01T12:00:00.000Z"
      }
    ]
  },
  "message": "Subscription history retrieved successfully"
}
```

#### Flutter Implementation Example
```dart
Future<Map<String, dynamic>> getSubscriptionHistory() async {
  try {
    final response = await http.get(
      Uri.parse('$baseUrl/subscription/history'),
      headers: {
        'Authorization': 'Bearer $token',
      },
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      return data['data'];
    } else {
      throw Exception('Failed to load subscription history');
    }
  } catch (e) {
    throw Exception('Error: $e');
  }
}
```

### 5. Cancel Subscription
**POST** `/cancel/:subscriptionId`

Cancels a specific subscription by ID.

#### Path Parameters
- `subscriptionId` (required): The ID of the subscription to cancel

#### Response
```json
{
  "success": true,
  "data": {
    "_id": "subscription_id",
    "type": "sustainbuddy_gpt",
    "platform": "google_play",
    "status": "cancelled",
    "autoRenew": false,
    "updatedAt": "2024-01-01T12:00:00.000Z"
  },
  "message": "Subscription cancelled successfully"
}
```

#### Flutter Implementation Example
```dart
Future<void> cancelSubscription(String subscriptionId) async {
  try {
    final response = await http.post(
      Uri.parse('$baseUrl/subscription/cancel/$subscriptionId'),
      headers: {
        'Authorization': 'Bearer $token',
      },
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      print('Subscription cancelled: ${data['data']}');
    } else {
      print('Error: ${response.body}');
    }
  } catch (e) {
    print('Exception: $e');
  }
}
```

### 6. Webhook Handler
**POST** `/webhook`

Handles subscription updates from Google Play Store and Apple App Store webhooks.

#### Request Body
```json
{
  "platform": "google_play" | "apple_store",
  "event": "subscription_renewed" | "subscription_cancelled" | "subscription_expired",
  "subscriptionId": "string",
  "data": {
    "newExpiryDate": "2024-02-01T00:00:00.000Z"
  }
}
```

#### Response
```json
{
  "success": true,
  "data": {
    "message": "Webhook processed successfully"
  }
}
```

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "success": false,
  "message": "Validation error message",
  "statusCode": 400
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "User not authenticated",
  "statusCode": 401
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Resource not found",
  "statusCode": 404
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Internal server error",
  "statusCode": 500
}
```

## Subscription Types

### SustainBuddy GPT
- **Type**: `sustainbuddy_gpt`
- **Description**: Provides access to AI-powered sustainability features
- **Features**: 
  - AI chat assistance for sustainability questions
  - Personalized sustainability recommendations
  - Advanced analytics and insights

### Content Creator
- **Type**: `content_creator`
- **Description**: Provides access to content creation tools
- **Features**:
  - Advanced content creation tools
  - Premium templates and resources
  - Enhanced publishing capabilities

## Platform Integration

### Google Play Store
- **Platform**: `google_play`
- **Receipt Format**: Purchase token from Google Play Billing
- **Verification**: Uses Google Play Developer API

### Apple App Store
- **Platform**: `apple_store`
- **Receipt Format**: Receipt data from StoreKit
- **Verification**: Uses Apple's receipt validation service

## Implementation Guidelines

### 1. Subscription Flow
1. User purchases subscription in app store
2. App receives purchase receipt
3. Call `/verify` endpoint with receipt data
4. Store subscription status locally
5. Enable premium features based on subscription status

### 2. Status Checking
- Check subscription status on app launch
- Periodically verify subscription status
- Handle expired/cancelled subscriptions gracefully

### 3. Error Handling
- Always handle network errors
- Implement retry logic for failed requests
- Show appropriate error messages to users

### 4. Security
- Never store sensitive receipt data locally
- Always verify receipts server-side
- Use HTTPS for all API calls

## Testing

### Test Environment
- Use sandbox receipts for testing
- Test both Google Play and Apple Store flows
- Verify webhook handling

### Test Cases
1. New subscription purchase
2. Subscription renewal
3. Subscription cancellation
4. Subscription expiration
5. Invalid receipt handling
6. Network error handling

## Support

For technical support or questions about the subscription API, please contact the development team or refer to the internal documentation. 