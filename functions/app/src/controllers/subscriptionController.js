const Subscription = require("../models/subscription");
const subscriptionDb = require("../db/subscriptionDb");
const messageQuotaService = require("../service/messageQuotaService");
const { getDb } = require("../db/conn");
const {
  verifyAndroidSubscription,
  processPlayStoreNotification,
} = require("../service/googlePlayService");

/**
 * Verify purchase and update subscription
 */
const verifyPurchase = async (req, res) => {
  try {
    const { packageName, subscriptionId, purchaseToken, platform } = req.body;
    const userId = req.firebaseToken.user_id;

    if (!packageName || !subscriptionId || !purchaseToken) {
      return res.status(400).json({
        success: false,
        message: "Missing required parameters",
      });
    }

    if (platform === "android") {
      const verificationResult = await verifyAndroidSubscription(
        packageName,
        subscriptionId,
        purchaseToken
      );

      if (verificationResult.isValid && verificationResult.isActive) {
        // Save or update subscription in database
        const subscriptionData = {
          userId,
          subscriptionId,
          purchaseToken,
          originalPurchaseDate: new Date(),
          expiryDate: verificationResult.expiryDate,
          autoRenewing: verificationResult.autoRenewing,
          status: "active",
          platform,
          lastVerifiedDate: new Date(),
        };

        const updatedSubscription = await subscriptionDb.updateSubscription(
          userId,
          subscriptionData
        );

        return res.json({
          success: true,
          message: "Subscription verified and activated",
          subscription: {
            status: updatedSubscription.status,
            expiryDate: updatedSubscription.expiryDate,
            autoRenewing: updatedSubscription.autoRenewing,
          },
        });
      } else {
        return res.status(400).json({
          success: false,
          message: "Invalid or inactive subscription",
          error: verificationResult.error,
        });
      }
    } else if (platform === "ios") {
      // TODO: Implement iOS receipt verification
      return res.status(501).json({
        success: false,
        message: "iOS subscription verification not implemented yet",
      });
    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid platform. Supported: android, ios",
      });
    }
  } catch (error) {
    console.error("Purchase verification error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error during purchase verification",
      error: error.message,
    });
  }
};

/**
 * Get user subscription status
 */
const getSubscriptionStatus = async (req, res) => {
  try {
    const userId = req.firebaseToken.user_id;

    const subscription = await subscriptionDb.getSubscriptionByUserId(userId);

    if (!subscription) {
      return res.json({
        success: true,
        hasSubscription: false,
        message: "No active subscription found",
      });
    }

    // Check if subscription is still valid
    const isActive =
      subscription.status === "active" && subscription.expiryDate > new Date();

    return res.json({
      success: true,
      hasSubscription: isActive,
      subscription: {
        status: isActive ? "active" : "expired",
        expiryDate: subscription.expiryDate,
        autoRenewing: subscription.autoRenewing,
        platform: subscription.platform,
      },
    });
  } catch (error) {
    console.error("Get subscription status error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error when getting subscription status",
      error: error.message,
    });
  }
};

/**
 * Handle real-time developer notifications from Google Play
 */
const handlePlayStoreNotification = async (req, res) => {
  try {
    const notificationData = req.body;

    // Validate the notification data
    if (!notificationData || !notificationData.subscriptionNotification) {
      return res.status(400).json({
        success: false,
        message: "Invalid notification data",
      });
    }

    const { subscriptionNotification } = notificationData;
    const { purchaseToken, subscriptionId } = subscriptionNotification;

    // Process the notification
    const processedNotification = processPlayStoreNotification(
      subscriptionNotification
    );

    if (!processedNotification.isValid) {
      return res.status(400).json({
        success: false,
        message: "Invalid notification format",
        error: processedNotification.error,
      });
    }

    // Find the subscription by purchase token
    const collection = await subscriptionDb.getDBCollection();
    const existingSubscription = await collection.findOne({ purchaseToken });

    if (!existingSubscription) {
      console.warn(
        `Subscription notification received for unknown purchase token: ${purchaseToken}`
      );
      return res.status(404).json({
        success: false,
        message: "Subscription not found in database",
      });
    }

    // Update the subscription status
    await subscriptionDb.updateSubscription(existingSubscription.userId, {
      status: processedNotification.status,
      lastVerifiedDate: new Date(),
    });

    return res.json({
      success: true,
      message: "Notification processed successfully",
    });
  } catch (error) {
    console.error("Play Store notification error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error processing notification",
      error: error.message,
    });
  }
};

/**
 * Get subscription analytics for admin
 */
const getSubscriptionAnalytics = async (req, res) => {
  try {
    // Check if user is admin
    const isAdmin = req.firebaseToken.admin === true;

    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Admin access required",
      });
    }

    const collection = await subscriptionDb.getDBCollection();

    // Get analytics data
    const totalSubscriptions = await collection.countDocuments();
    const activeSubscriptions = await collection.countDocuments({
      status: "active",
    });
    const cancelledSubscriptions = await collection.countDocuments({
      status: "cancelled",
    });
    const expiredSubscriptions = await collection.countDocuments({
      status: "expired",
    });

    const platformBreakdown = await collection
      .aggregate([{ $group: { _id: "$platform", count: { $sum: 1 } } }])
      .toArray();

    return res.json({
      success: true,
      analytics: {
        totalSubscriptions,
        activeSubscriptions,
        cancelledSubscriptions,
        expiredSubscriptions,
        platformBreakdown: platformBreakdown.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
      },
    });
  } catch (error) {
    console.error("Subscription analytics error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error fetching analytics",
      error: error.message,
    });
  }
};

/**
 * Get user's message quota status
 */
const getUserQuotaStatus = async (req, res) => {
  try {
    const userId = req.firebaseToken.user_id;

    const quotaInfo = await messageQuotaService.checkMessageQuota(userId);

    return res.json({
      success: true,
      quota: {
        hasQuotaLeft: quotaInfo.hasQuotaLeft,
        remainingQuota: quotaInfo.remainingQuota,
        isPremium: quotaInfo.isSubscribed,
        dailyLimit: quotaInfo.dailyLimit,
        standardLimit: messageQuotaService.FREE_MESSAGES_PER_DAY,
        premiumLimit: messageQuotaService.PREMIUM_MESSAGES_PER_DAY,
      },
    });
  } catch (error) {
    console.error("Get user quota status error:", error);
    return res.status(500).json({
      success: false,
      message: "Error getting user quota status",
      error: error.message,
    });
  }
};

/**
 * Admin endpoint to manage user quotas
 */
const manageUserQuotas = async (req, res) => {
  try {
    // Check if user is admin
    const isAdmin = req.firebaseToken.admin === true;

    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Admin access required",
      });
    }

    const { action, userId } = req.body;

    if (action === "reset" && userId) {
      // Reset quota for a specific user
      const db = getDb();
      const collection = await db.collection("messageQuota");
      await collection.deleteMany({ userId });

      return res.json({
        success: true,
        message: `Quota reset for user ${userId}`,
      });
    } else if (action === "reset_all") {
      // Reset all quotas
      await messageQuotaService.resetAllQuotas();

      return res.json({
        success: true,
        message: "All user quotas have been reset",
      });
    } else if (action === "get_all") {
      // Get all quota usage
      const db = getDb();
      const collection = await db.collection("messageQuota");
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const quotas = await collection
        .find({
          date: { $gte: today },
        })
        .toArray();

      return res.json({
        success: true,
        quotas,
      });
    }

    return res.status(400).json({
      success: false,
      message: "Invalid action specified",
    });
  } catch (error) {
    console.error("Manage user quotas error:", error);
    return res.status(500).json({
      success: false,
      message: "Error managing user quotas",
      error: error.message,
    });
  }
};

module.exports = {
  verifyPurchase,
  getSubscriptionStatus,
  handlePlayStoreNotification,
  getSubscriptionAnalytics,
  getUserQuotaStatus,
  manageUserQuotas,
};
