import 'dart:convert';
import 'package:http/http.dart' as http;

class SubscriptionService {
  static const String baseUrl = 'https://your-api-domain.com/api';
  static const String subscriptionEndpoint = '$baseUrl/subscription';

  final String token;

  SubscriptionService({required this.token});

  // Headers for authenticated requests
  Map<String, String> get _headers => {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer $token',
  };

  /// Verify subscription purchase
  Future<Map<String, dynamic>> verifySubscription({
    required String platform,
    required String receipt,
    required String type,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$subscriptionEndpoint/verify'),
        headers: _headers,
        body: jsonEncode({
          'platform': platform,
          'receipt': receipt,
          'type': type,
        }),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return data['data'];
      } else {
        final error = jsonDecode(response.body);
        throw Exception(error['message'] ?? 'Failed to verify subscription');
      }
    } catch (e) {
      throw Exception('Error verifying subscription: $e');
    }
  }

  /// Get user's active subscriptions
  Future<Map<String, dynamic>> getUserSubscriptions() async {
    try {
      final response = await http.get(
        Uri.parse('$subscriptionEndpoint/my-subscriptions'),
        headers: _headers,
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return data['data'];
      } else {
        final error = jsonDecode(response.body);
        throw Exception(error['message'] ?? 'Failed to get subscriptions');
      }
    } catch (e) {
      throw Exception('Error getting subscriptions: $e');
    }
  }

  /// Check subscription status with optional filtering
  Future<Map<String, dynamic>> checkSubscriptionStatus({String? type}) async {
    try {
      final queryParams = type != null ? {'type': type} : {};
      final uri = Uri.parse(
        '$subscriptionEndpoint/status',
      ).replace(queryParameters: queryParams);

      final response = await http.get(uri, headers: _headers);

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return data['data'];
      } else {
        final error = jsonDecode(response.body);
        throw Exception(
          error['message'] ?? 'Failed to check subscription status',
        );
      }
    } catch (e) {
      throw Exception('Error checking subscription status: $e');
    }
  }

  /// Get subscription history
  Future<Map<String, dynamic>> getSubscriptionHistory() async {
    try {
      final response = await http.get(
        Uri.parse('$subscriptionEndpoint/history'),
        headers: _headers,
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return data['data'];
      } else {
        final error = jsonDecode(response.body);
        throw Exception(
          error['message'] ?? 'Failed to get subscription history',
        );
      }
    } catch (e) {
      throw Exception('Error getting subscription history: $e');
    }
  }

  /// Cancel a subscription
  Future<Map<String, dynamic>> cancelSubscription(String subscriptionId) async {
    try {
      final response = await http.post(
        Uri.parse('$subscriptionEndpoint/cancel/$subscriptionId'),
        headers: _headers,
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return data['data'];
      } else {
        final error = jsonDecode(response.body);
        throw Exception(error['message'] ?? 'Failed to cancel subscription');
      }
    } catch (e) {
      throw Exception('Error cancelling subscription: $e');
    }
  }

  /// Check if user has active subscription for specific type
  Future<bool> hasActiveSubscription(String type) async {
    try {
      final subscriptions = await getUserSubscriptions();

      if (type == 'sustainbuddy_gpt') {
        return subscriptions['sustainbuddyGPT']['active'] ?? false;
      } else if (type == 'content_creator') {
        return subscriptions['contentCreator']['active'] ?? false;
      }

      return false;
    } catch (e) {
      print('Error checking active subscription: $e');
      return false;
    }
  }

  /// Get subscription details for specific type
  Future<Map<String, dynamic>?> getSubscriptionDetails(String type) async {
    try {
      final subscriptions = await getUserSubscriptions();

      if (type == 'sustainbuddy_gpt') {
        return subscriptions['sustainbuddyGPT']['subscription'];
      } else if (type == 'content_creator') {
        return subscriptions['contentCreator']['subscription'];
      }

      return null;
    } catch (e) {
      print('Error getting subscription details: $e');
      return null;
    }
  }
}

// Data models for type safety
class Subscription {
  final String id;
  final String type;
  final String platform;
  final String status;
  final DateTime startDate;
  final DateTime endDate;
  final bool autoRenew;
  final DateTime lastVerifiedAt;

  Subscription({
    required this.id,
    required this.type,
    required this.platform,
    required this.status,
    required this.startDate,
    required this.endDate,
    required this.autoRenew,
    required this.lastVerifiedAt,
  });

  factory Subscription.fromJson(Map<String, dynamic> json) {
    return Subscription(
      id: json['_id'],
      type: json['type'],
      platform: json['platform'],
      status: json['status'],
      startDate: DateTime.parse(json['startDate']),
      endDate: DateTime.parse(json['endDate']),
      autoRenew: json['autoRenew'],
      lastVerifiedAt: DateTime.parse(json['lastVerifiedAt']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'type': type,
      'platform': platform,
      'status': status,
      'startDate': startDate.toIso8601String(),
      'endDate': endDate.toIso8601String(),
      'autoRenew': autoRenew,
      'lastVerifiedAt': lastVerifiedAt.toIso8601String(),
    };
  }
}

class SubscriptionStatus {
  final bool active;
  final Subscription? subscription;

  SubscriptionStatus({required this.active, this.subscription});

  factory SubscriptionStatus.fromJson(Map<String, dynamic> json) {
    return SubscriptionStatus(
      active: json['active'] ?? false,
      subscription:
          json['subscription'] != null
              ? Subscription.fromJson(json['subscription'])
              : null,
    );
  }
}

class UserSubscriptions {
  final SubscriptionStatus sustainbuddyGPT;
  final SubscriptionStatus contentCreator;

  UserSubscriptions({
    required this.sustainbuddyGPT,
    required this.contentCreator,
  });

  factory UserSubscriptions.fromJson(Map<String, dynamic> json) {
    return UserSubscriptions(
      sustainbuddyGPT: SubscriptionStatus.fromJson(json['sustainbuddyGPT']),
      contentCreator: SubscriptionStatus.fromJson(json['contentCreator']),
    );
  }
}

// Example usage
void main() async {
  // Initialize the service with user's JWT token
  final subscriptionService = SubscriptionService(token: 'your_jwt_token_here');

  try {
    // Get user's subscriptions
    final subscriptions = await subscriptionService.getUserSubscriptions();
    print('User subscriptions: $subscriptions');

    // Check if user has active SustainBuddy GPT subscription
    final hasGPT = await subscriptionService.hasActiveSubscription(
      'sustainbuddy_gpt',
    );
    print('Has SustainBuddy GPT: $hasGPT');

    // Get subscription history
    final history = await subscriptionService.getSubscriptionHistory();
    print('Subscription history: $history');
  } catch (e) {
    print('Error: $e');
  }
}
