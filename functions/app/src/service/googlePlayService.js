const { google } = require("googleapis");
const path = require("path");
const fs = require("fs");

/**
 * Get Google Auth client for Play Store API
 * @returns {Promise<Object>} Google Auth client
 */
async function getGoogleAuthClient() {
  try {
    // First check if service account JSON is provided as an environment variable
    if (process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON) {
      try {
        const serviceAccountJson = JSON.parse(
          process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON
        );
        return new google.auth.GoogleAuth({
          credentials: serviceAccountJson,
          scopes: ["https://www.googleapis.com/auth/androidpublisher"],
        });
      } catch (error) {
        console.error(
          "Error parsing service account JSON from environment variable:",
          error
        );
        // Fall back to file-based approach
      }
    }

    // Fall back to file-based service account
    const SERVICE_ACCOUNT_KEY_PATH =
      process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_KEY_PATH ||
      path.join(__dirname, "../../config/google-play-service-account.json");

    return new google.auth.GoogleAuth({
      keyFile: SERVICE_ACCOUNT_KEY_PATH,
      scopes: ["https://www.googleapis.com/auth/androidpublisher"],
    });
  } catch (error) {
    console.error("Error initializing Google Auth client:", error);
    throw error;
  }
}

/**
 * Verify an Android subscription with Google Play
 * @param {string} packageName - The package name of the app
 * @param {string} subscriptionId - The subscription product ID
 * @param {string} purchaseToken - The token provided by Google Play on purchase
 * @returns {object} - Verification result with subscription details
 */
async function verifyAndroidSubscription(
  packageName,
  subscriptionId,
  purchaseToken
) {
  try {
    // Initialize the Google Auth client
    const auth = await getGoogleAuthClient();
    const authClient = await auth.getClient();
    const publisher = google.androidpublisher("v3");

    // Verify the subscription with Google Play
    const response = await publisher.purchases.subscriptions.get({
      auth: authClient,
      packageName: packageName,
      subscriptionId: subscriptionId,
      token: purchaseToken,
    });

    // Check if subscription is active
    const isActive =
      response.data.expiryTimeMillis > Date.now() &&
      response.data.paymentState === 1;

    return {
      isValid: true,
      isActive: isActive,
      expiryDate: new Date(parseInt(response.data.expiryTimeMillis)),
      autoRenewing: response.data.autoRenewing,
      subscriptionId: subscriptionId,
      purchaseToken: purchaseToken,
      data: response.data,
    };
  } catch (error) {
    console.error("Google Play verification error:", error);
    return {
      isValid: false,
      error: error.message,
    };
  }
}

/**
 * Process subscription notification from Google Play
 * @param {object} notification - The notification payload from Google Play
 * @returns {object} - Processed notification details
 */
function processPlayStoreNotification(notification) {
  try {
    const { notificationType, purchaseToken, subscriptionId } = notification;

    let status;
    switch (notificationType) {
      case 1: // SUBSCRIPTION_RECOVERED
      case 2: // SUBSCRIPTION_RENEWED
      case 4: // SUBSCRIPTION_PURCHASED
        status = "active";
        break;
      case 3: // SUBSCRIPTION_CANCELED
        status = "cancelled";
        break;
      case 5: // SUBSCRIPTION_ON_HOLD
      case 6: // SUBSCRIPTION_IN_GRACE_PERIOD
        status = "grace_period";
        break;
      case 7: // SUBSCRIPTION_RESTARTED
        status = "active";
        break;
      case 8: // SUBSCRIPTION_PRICE_CHANGE_CONFIRMED
        status = "active";
        break;
      case 9: // SUBSCRIPTION_DEFERRED
        status = "deferred";
        break;
      case 10: // SUBSCRIPTION_PAUSED
        status = "paused";
        break;
      case 11: // SUBSCRIPTION_PAUSE_SCHEDULE_CHANGED
        status = "paused";
        break;
      case 12: // SUBSCRIPTION_REVOKED
      case 13: // SUBSCRIPTION_EXPIRED
        status = "expired";
        break;
      default:
        status = "unknown";
    }

    return {
      isValid: true,
      status,
      subscriptionId,
      purchaseToken,
      notificationType,
    };
  } catch (error) {
    console.error("Error processing Play Store notification:", error);
    return {
      isValid: false,
      error: error.message,
    };
  }
}

module.exports = {
  verifyAndroidSubscription,
  processPlayStoreNotification,
};
