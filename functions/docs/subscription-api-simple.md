# Budget AI Subscription API - Quick Reference

## Overview

The Budget AI API now includes a subscription system with tiered message quotas:

- **Free users**: 5 AI messages per day
- **Premium users**: 100 AI messages per day

## Authentication

All endpoints require Firebase JWT tokens:

```
Authorization: Bearer <firebase_jwt_token>
```

## Key Endpoints

### 1. Verify Purchase

```
POST /subscriptions/verify-purchase
```

Activates a premium subscription after verifying the purchase with Google Play.

### 2. Check Subscription Status

```
GET /subscriptions/status
```

Returns whether the user has an active subscription.

### 3. Check Message Quota

```
GET /subscriptions/message-quota
```

Returns the user's remaining messages for the day.

### 4. Create AI Expense (Already Returns Quota)

```
POST /ai/expense
```

Creates an expense using AI and automatically returns quota information in the response.

## Response Examples

### Subscription Status Response

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

### Message Quota Response

```json
{
  "success": true,
  "quota": {
    "hasQuotaLeft": true,
    "remainingQuota": 95,
    "isPremium": true,
    "dailyLimit": 100,
    "standardLimit": 5,
    "premiumLimit": 100
  }
}
```

### AI Expense Response (Already Has Quota Info)

```json
{
  "expense": {
    "_id": "6098a7b9b54c3e001c3d5678",
    "description": "Coffee",
    "amount": 10,
    "category": "Food & Drink",
    "date": "2023-04-14T12:00:00Z"
  },
  "remainingQuota": 99,
  "dailyLimit": 100,
  "isPremium": true
}
```

### Quota Exceeded Error

```json
{
  "errorMessage": "Daily message limit (5) reached. Upgrade to premium for 100 AI messages per day.",
  "quotaExceeded": true,
  "remainingQuota": 0,
  "dailyLimit": 5,
  "isPremium": false
}
```

## Integration Guidelines

1. **Display Quota**: Always display remaining quota after each AI expense creation
2. **Handle Quota Errors**: Show upgrade prompts when quotas are exceeded (403 errors)
3. **Optimize UX**: Consider showing upgrade prompts when quota is running low (< 20%)
4. **Check on Start**: Check quota status when initializing the app to show appropriate UI
5. **Use Existing Data**: No need to make separate quota calls after AI expense creation - use the quota data returned in the AI expense response
