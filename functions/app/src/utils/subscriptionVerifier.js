const { google } = require("googleapis");
const subscriptionDb = require("../db/subscriptionDb");
const { verifyAndroidSubscription } = require("../service/googlePlayService");

/**
 * Verify all active subscriptions and update their status
 * This should be run as a scheduled job
 */
async function verifyAllActiveSubscriptions() {
  try {
    console.log("Starting periodic subscription verification job");

    // Get all active subscriptions
    const activeSubscriptions =
      await subscriptionDb.getAllActiveSubscriptions();
    console.log(
      `Found ${activeSubscriptions.length} active subscriptions to verify`
    );

    const results = {
      total: activeSubscriptions.length,
      verified: 0,
      expired: 0,
      errors: 0,
    };

    // Process each subscription
    for (const subscription of activeSubscriptions) {
      try {
        if (subscription.platform === "android") {
          // Extract the package name from the subscription ID if not stored separately
          // This assumes subscription IDs are in format 'packageName.subscriptionLevel'
          const packageName =
            process.env.ANDROID_PACKAGE_NAME ||
            subscription.subscriptionId.split(".")[0];

          const verificationResult = await verifyAndroidSubscription(
            packageName,
            subscription.subscriptionId,
            subscription.purchaseToken
          );

          if (verificationResult.isValid) {
            // Update subscription status
            const newStatus = verificationResult.isActive
              ? "active"
              : "expired";

            await subscriptionDb.updateSubscription(subscription.userId, {
              status: newStatus,
              expiryDate: verificationResult.expiryDate,
              autoRenewing: verificationResult.autoRenewing,
              lastVerifiedDate: new Date(),
            });

            if (newStatus === "active") {
              results.verified++;
            } else {
              results.expired++;
            }
          } else {
            console.error(
              `Error verifying subscription ${subscription._id}: ${verificationResult.error}`
            );
            results.errors++;
          }
        } else if (subscription.platform === "ios") {
          // TODO: Implement iOS receipt verification
          console.log(
            `Skipping iOS subscription verification for ${subscription._id}`
          );
        }
      } catch (error) {
        console.error(
          `Error processing subscription ${subscription._id}:`,
          error
        );
        results.errors++;
      }
    }

    console.log("Subscription verification job completed", results);
    return results;
  } catch (error) {
    console.error("Error in subscription verification job:", error);
    throw error;
  }
}

module.exports = {
  verifyAllActiveSubscriptions,
};
