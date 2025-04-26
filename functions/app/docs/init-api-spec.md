# Initialization API Specification

## Endpoint Overview

- **URL**: `/app/init`
- **Method**: `GET`
- **Authentication**: Required (Firebase token)
- **Description**: Initializes the app by retrieving user expenses, quota information, budget details, and configuration settings.

## Performance Optimization

This endpoint has been optimized for performance:

- Data sources (expenses, subscriptions, budgets, and configuration) are fetched in parallel
- Processing happens after all data is retrieved
- Reduces overall response time by eliminating sequential waits

## Request Parameters

- **fromDate** (optional): Start date for expense retrieval (format: ISO string)
- **toDate** (optional): End date for expense retrieval (format: ISO string)
  - If not provided, defaults to current month

## Response Structure

```json
{
  "expenses": [
    {
      "_id": "string",
      "userId": "string",
      "category": "string",
      "description": "string",
      "amount": "number",
      "date": "string" // ISO date
    }
  ],

  "quota": {
    "hasQuotaLeft": "boolean",
    "remainingQuota": "number",
    "isPremium": "boolean",
    "dailyLimit": "number",
    "standardLimit": "number",
    "premiumLimit": "number"
  },

  "budget": {
    "budget": {
      "totalBudget": "number",
      "categoryBudgets": {
        "Food": "number",
        "Transport": "number"
        // other categories...
      },
      "_id": "string" // only if budgetExists is true
    },
    "categories": ["string"], // list of available categories
    "budgetExists": "boolean"
  },

  "budgetSummary": {
    "totalBudget": "number",
    "totalSpending": "number",
    "remainingBudget": "number",
    "categories": [
      {
        "category": "string",
        "budget": "number",
        "actual": "number",
        "remaining": "number"
      }
    ],
    "month": "number", // 1-12
    "year": "number", // e.g., 2023
    "budgetExists": "boolean"
  },

  "featureFlags": {
    "enableBudgetFeature": "boolean",
    "enableAIExpenses": "boolean",
    "enableCategoryCustomization": "boolean",
    "enableDataExport": "boolean",
    "enableWhatsappIntegration": "boolean"
    // May include additional feature flags defined in app_config
  },

  "config": {
    // All configuration settings from the app_config document
    "DISORD_URL": "string",
    "featureFlags": {
      // feature flags object
    }
    // Other config fields
  },

  "dateRange": {
    "fromDate": "string", // ISO date
    "toDate": "string" // ISO date
  }
}
```

## Feature Flags

The `featureFlags` object contains boolean flags controlling feature availability:

- **enableBudgetFeature**: Controls if budget functionality is enabled
- **enableAIExpenses**: Controls AI-based expense analysis
- **enableCategoryCustomization**: Controls custom expense categories
- **enableDataExport**: Controls data export functionality
- **enableWhatsappIntegration**: Controls WhatsApp integration

## Config Table Structure

The configuration is stored in Firestore with the following structure:

- A `config` collection contains a document called `app_config`
- The `app_config` document contains all configuration settings as fields
- Standard fields include `DISORD_URL` and the `featureFlags` object
- Additional fields can be added as needed for application configuration

## Error Responses

- **400 Bad Request**: Invalid user
  ```json
  {
    "errorMessage": "Invalid User"
  }
  ```
- **500 Internal Server Error**: Server-side error
  ```json
  {
    "success": false,
    "errorMessage": "Failed to initialize app",
    "error": "Error details"
  }
  ```
