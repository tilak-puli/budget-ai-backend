const subscriptionDb = require("../db/subscriptionDb");
const { getDb } = require("../db/conn");

// Constants for message limits
const FREE_MESSAGES_PER_DAY = 5;
const PREMIUM_MESSAGES_PER_DAY = 100;

/**
 * Check if user has free messages left
 * @param {string} userId - User ID
 * @returns {Promise<{hasQuotaLeft: boolean, remainingQuota: number, isSubscribed: boolean}>}
 */
async function checkMessageQuota(userId) {
  try {
    // First, check if user has an active subscription
    const subscription = await subscriptionDb.getSubscriptionByUserId(userId);
    const isSubscribed =
      subscription &&
      subscription.status === "active" &&
      subscription.expiryDate > new Date();

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1); // Start of tomorrow

    // Get user's message usage for today
    const db = getDb();
    const collection = await db.collection("messageQuota");

    const userQuota = await collection.findOne({
      userId,
      date: { $gte: today, $lt: tomorrow },
    });

    // Set daily limit based on subscription status
    const dailyLimit = isSubscribed
      ? PREMIUM_MESSAGES_PER_DAY
      : FREE_MESSAGES_PER_DAY;

    if (!userQuota) {
      // No usage today, initialize with full quota
      return {
        hasQuotaLeft: true,
        remainingQuota: dailyLimit,
        isSubscribed: isSubscribed,
        dailyLimit: dailyLimit,
      };
    }

    const usedMessages = userQuota.count || 0;
    const remainingQuota = dailyLimit - usedMessages;

    return {
      hasQuotaLeft: remainingQuota > 0,
      remainingQuota,
      isSubscribed: isSubscribed,
      dailyLimit: dailyLimit,
    };
  } catch (error) {
    console.error("Error checking message quota:", error);
    // Default to allowing the message in case of errors
    return {
      hasQuotaLeft: true,
      remainingQuota: 1,
      isSubscribed: false,
      error: error.message,
      dailyLimit: FREE_MESSAGES_PER_DAY,
    };
  }
}

/**
 * Increment the message count for a user
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} - Success status
 */
async function incrementMessageCount(userId) {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const db = getDb();
    const collection = await db.collection("messageQuota");

    // Update or create the quota document for today
    const result = await collection.updateOne(
      { userId, date: today },
      { $inc: { count: 1 } },
      { upsert: true }
    );

    return result.modifiedCount > 0 || result.upsertedCount > 0;
  } catch (error) {
    console.error("Error incrementing message count:", error);
    return false;
  }
}

/**
 * Reset all quotas (useful for testing or admin functions)
 */
async function resetAllQuotas() {
  try {
    const db = getDb();
    const collection = await db.collection("messageQuota");

    await collection.deleteMany({});
    return true;
  } catch (error) {
    console.error("Error resetting quotas:", error);
    return false;
  }
}

module.exports = {
  checkMessageQuota,
  incrementMessageCount,
  resetAllQuotas,
  FREE_MESSAGES_PER_DAY,
  PREMIUM_MESSAGES_PER_DAY,
};
