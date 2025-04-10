# Budget AI Subscription System Setup Guide

Follow these steps to complete the setup of your subscription system for Budget AI.

## 1. Google Play Console Setup

### Create In-App Products

1. Log in to [Google Play Console](https://play.google.com/console/)
2. Navigate to your app
3. Go to **Monetize** > **Products** > **Subscriptions**
4. Click **Create subscription**
5. Set up your subscription product(s):
   - Basic subscription ID: `premium_monthly`
   - Advanced subscription ID: `premium_yearly`
   - Configure pricing, billing period, free trial, etc.
6. Save and activate your subscriptions

### Configure Real-time Developer Notifications

1. In Google Play Console, go to **Setup** > **Developer notifications**
2. Click **Create notification**
3. Select **Real-time developer notifications**
4. Enter your webhook URL: `https://your-firebase-url.app/subscriptions/notifications`
5. Select the subscription events you want to receive
6. Save the configuration

## 2. Google Cloud / Firebase Setup

### Create a Service Account for Google Play API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select the same project as your Google Play app
3. Navigate to **IAM & Admin** > **Service Accounts**
4. Click **Create Service Account**
5. Name: `budget-ai-subscription-verifier`
6. Role: **Service Account User**
7. Click **Done**

### Generate and Download Service Account Key

1. Find your new service account in the list
2. Click on the service account name
3. Go to the **Keys** tab
4. Click **Add Key** > **Create New Key**
5. Select **JSON** format and click **Create**
6. Save the downloaded JSON file

### Link Service Account to Google Play

1. Go back to Google Play Console
2. Navigate to **Setup** > **API access**
3. Link your Google Cloud project if not already linked
4. Under **Service accounts**, find your service account
5. Grant it the necessary permissions:
   - View app information
   - View financial data
   - Manage orders and subscriptions

## 3. Deployment Options

You have two options for deploying with Firebase Functions:

### Option A: Deploy with Service Account File (Easier for testing)

1. Save the service account JSON file as:
   ```
   functions/app/config/google-play-service-account.json
   ```
2. Update `.env` file with your app's package name:
   ```
   ANDROID_PACKAGE_NAME=com.yourcompany.budgetai
   ```
3. Deploy to Firebase:
   ```
   firebase deploy --only functions
   ```

### Option B: Use Environment Variables (Better for production)

1. Convert your service account JSON to a one-line string
2. In Firebase Console, go to **Functions** > **Your function**
3. Add environment variable:
   - Name: `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON`
   - Value: Your entire service account JSON as a single line
4. Add environment variable:
   - Name: `ANDROID_PACKAGE_NAME`
   - Value: Your app's package name (e.g., `com.tilakpuli.budget_ai`)
5. Deploy to Firebase:
   ```
   firebase deploy --only functions
   ```

## 4. Testing the Subscription System

### Test Purchase Flow

1. Add test accounts in Google Play Console
2. Use the test account to make a purchase in your app
3. Verify the purchase is properly recorded in your backend
4. Check that the user's subscription status is updated correctly

### Test Message Quota

1. Make AI expense requests as a free user to verify the 5/day limit
2. Upgrade to premium and verify the 100/day limit
3. Test quota reset at midnight UTC

### Test Webhook Notifications

1. Use Google Play Console to send test notifications
2. Verify your webhook receives and processes them correctly
3. Check that subscription status updates in your database

## 5. Integration with Frontend

Make sure your frontend app:

1. Properly displays quota information from the `/ai/expense` responses
2. Shows appropriate upgrade prompts when quota is low
3. Handles quota exceeded errors gracefully
4. Verifies purchases with the backend after completing payment

## 6. Monitoring in Production

Once launched, monitor:

1. Subscription verification logs for any failures
2. Webhook notification processing
3. User quota usage patterns
4. Conversion rates from free to premium
