const express = require("express");
const router = express.Router();
const subscriptionController = require("../controllers/subscriptionController");
const authMiddleware = require("../middleware/auth");

// Public endpoint for Google Play real-time developer notifications
router.post(
  "/subscriptions/notifications",
  subscriptionController.handlePlayStoreNotification
);

// Routes that require authentication
router.use("/subscriptions", authMiddleware);

// Purchase verification endpoint
router.post(
  "/subscriptions/verify-purchase",
  subscriptionController.verifyPurchase
);

// User subscription status endpoint
router.get(
  "/subscriptions/status",
  subscriptionController.getSubscriptionStatus
);

// User message quota status endpoint
router.get(
  "/subscriptions/message-quota",
  subscriptionController.getUserQuotaStatus
);

// Admin analytics endpoint (admin role verification done in controller)
router.get(
  "/admin/subscription-analytics",
  authMiddleware,
  subscriptionController.getSubscriptionAnalytics
);
router.post(
  "/admin/manage-quotas",
  authMiddleware,
  subscriptionController.manageUserQuotas
);

module.exports = router;
