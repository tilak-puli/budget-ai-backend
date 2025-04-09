const { onRequest } = require("firebase-functions/v2/https");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { app } = require("./app/main");
const {
  verifyAllActiveSubscriptions,
} = require("./app/src/utils/subscriptionVerifier");

// HTTP backend
exports.backend = onRequest(app);

// Scheduled job for subscription verification - runs daily at 2:00 AM
exports.verifySubscriptions = onSchedule(
  {
    schedule: "0 2 * * *", // Cron schedule format (minute, hour, day of month, month, day of week)
    timeZone: "UTC", // Specify timezone (UTC is recommended for cloud functions)
    retryCount: 3, // Number of retries if the function fails
    memory: "256MiB", // Memory allocation
  },
  async (event) => {
    try {
      console.log("Running scheduled subscription verification job");
      const results = await verifyAllActiveSubscriptions();
      return results;
    } catch (error) {
      console.error("Error in scheduled subscription verification:", error);
      throw error;
    }
  }
);
