# Budget AI Subscription System

This document provides information about the subscription system implementation for the Budget AI app.

## Overview

The subscription system allows users to purchase premium features through in-app purchases on Android (and eventually iOS). The system verifies purchases with the respective app stores, maintains subscription state, and provides endpoints for checking subscription status.

## Components

1. **Subscription Model**: Defines the data structure for subscriptions
2. **Google Play Integration**: Verifies purchases with Google Play Developer API
3. **Real-time Developer Notifications**: Webhook for receiving real-time subscription events
4. **Periodic Verification**: Scheduled job to verify subscription status
5. **User Entitlement API**: Endpoint for checking subscription status

## API Endpoints

### 1. Purchase Verification

- **URL**: `/subscriptions/verify-purchase`
- **Method**: POST
- **Authentication**: Required
- **Body**:
  ```json
  {
    "packageName": "com.yourcompany.budgetai",
    "subscriptionId": "premium_monthly",
    "purchaseToken": "token_from_google_play",
    "platform": "android"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "message": "Subscription verified and activated",
    "subscription": {
      "status": "active",
      "expiryDate": "2023-12-31T23:59:59Z",
      "autoRenewing": true
    }
  }
  ```

### 2. Subscription Status

- **URL**: `/subscriptions/status`
- **Method**: GET
- **Authentication**: Required
- **Response**:
  ```json
  {
    "success": true,
    "hasSubscription": true,
    "subscription": {
      "status": "active",
      "expiryDate": "2023-12-31T23:59:59Z",
      "autoRenewing": true,
      "platform": "android"
    }
  }
  ```

### 3. Real-time Developer Notifications

- **URL**: `/subscriptions/notifications`
- **Method**: POST
- **Authentication**: None (Google Play server-to-server)
- **Body**: Google Play notification payload
- **Response**: 200 OK

### 4. Subscription Analytics (Admin only)

- **URL**: `/admin/subscription-analytics`
- **Method**: GET
- **Authentication**: Required (Admin role)
- **Response**:
  ```json
  {
    "success": true,
    "analytics": {
      "totalSubscriptions": 100,
      "activeSubscriptions": 75,
      "cancelledSubscriptions": 15,
      "expiredSubscriptions": 10,
      "platformBreakdown": {
        "android": 80,
        "ios": 20
      }
    }
  }
  ```

## Setup Instructions

### 1. Google Play Setup

1. Create a service account in the Google Cloud Console:

   - Go to https://console.cloud.google.com/
   - Create a new project or use an existing one
   - Navigate to "IAM & Admin" > "Service Accounts"
   - Create a new service account
   - Grant it the "Service Account User" role
   - Create a JSON key and download it

2. Link the service account to your Google Play Console:

   - Go to Google Play Console
   - Navigate to "Setup" > "API access"
   - Link your Google Cloud project
   - Grant the necessary permissions (view/manage subscriptions)

3. Configure your backend:
   - Save the downloaded JSON key as `functions/app/config/google-play-service-account.json`
   - Update the `ANDROID_PACKAGE_NAME` in your `.env` file

### 2. Real-time Developer Notifications

1. Set up Google Play Developer Notifications:
   - Go to Google Play Console
   - Navigate to "Setup" > "Developer notifications"
   - Add a new notification destination
   - Enter your webhook URL: `https://your-backend-url/subscriptions/notifications`
   - Select "Test" to verify the setup

## Testing

1. Use Google Play's test track to create test subscriptions
2. Configure test accounts in Google Play Console
3. Use the Android app to make test purchases
4. Verify that the subscription status is correctly reflected in the app

## Security Considerations

1. Always verify the purchase token with Google Play
2. Use HTTPS for all API endpoints
3. Implement rate limiting to prevent abuse
4. Do not store service account keys in the code repository
5. Regularly verify subscription status to prevent unauthorized access

## Troubleshooting

1. Check the logs for verification errors
2. Ensure the service account has the correct permissions
3. Verify that the package name matches your Android app
4. Check that the subscription ID is correct
5. Ensure the purchase token is valid and not expired
