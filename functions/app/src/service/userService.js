const { Firestore } = require("@google-cloud/firestore");
const firestore = new Firestore();

// Constants for message limits
const FREE_MESSAGES_PER_DAY = 5;
const PREMIUM_MESSAGES_PER_DAY = 100;

/**
 * Get or create user document
 */
const getOrCreateUser = async (userId) => {
  const userRef = firestore.collection("users").doc(userId);
  const userDoc = await userRef.get();

  if (!userDoc.exists) {
    // Create new user document
    await userRef.set({
      userId,
      messagesUsedToday: 0,
      lastUsageDate: null,
      createdAt: new Date(),
    });
    return {
      userId,
      messagesUsedToday: 0,
      lastUsageDate: null,
      createdAt: new Date(),
    };
  }

  return userDoc.data();
};

/**
 * Check if user has messages left for today
 */
const checkMessageQuota = async (userId, isSubscribed) => {
  try {
    const userRef = firestore.collection("users").doc(userId);
    const user = await getOrCreateUser(userId);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Reset quota if last usage was not today
    if (
      !user.lastUsageDate ||
      new Date(user.lastUsageDate.toDate()).getTime() < today.getTime()
    ) {
      await userRef.update({
        messagesUsedToday: 0,
        lastUsageDate: today,
      });
      user.messagesUsedToday = 0;
    }

    const dailyLimit = isSubscribed
      ? PREMIUM_MESSAGES_PER_DAY
      : FREE_MESSAGES_PER_DAY;
    const remainingQuota = dailyLimit - (user.messagesUsedToday || 0);

    return {
      hasQuotaLeft: remainingQuota > 0,
      remainingQuota,
      isSubscribed,
      dailyLimit,
    };
  } catch (error) {
    console.error("Error checking message quota:", error);
    return {
      hasQuotaLeft: false,
      remainingQuota: 0,
      isSubscribed,
      dailyLimit: isSubscribed
        ? PREMIUM_MESSAGES_PER_DAY
        : FREE_MESSAGES_PER_DAY,
      error: error.message,
    };
  }
};

/**
 * Increment message count for today
 */
const incrementMessageCount = async (userId) => {
  try {
    const userRef = firestore.collection("users").doc(userId);
    const user = await getOrCreateUser(userId);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // If last usage was not today, reset the counter
    if (
      !user.lastUsageDate ||
      new Date(user.lastUsageDate.toDate()).getTime() < today.getTime()
    ) {
      await userRef.update({
        messagesUsedToday: 1,
        lastUsageDate: today,
      });
      return true;
    }

    // Increment the counter
    await userRef.update({
      messagesUsedToday: (user.messagesUsedToday || 0) + 1,
      lastUsageDate: today,
    });

    return true;
  } catch (error) {
    console.error("Error incrementing message count:", error);
    return false;
  }
};

module.exports = {
  checkMessageQuota,
  incrementMessageCount,
  FREE_MESSAGES_PER_DAY,
  PREMIUM_MESSAGES_PER_DAY,
  getOrCreateUser,
};
