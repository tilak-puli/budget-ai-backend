const express = require("express");
const router = express.Router();
const appController = require("../controllers/appController");
const authMiddleware = require("../middleware/auth");
const feedbackController = require("../controllers/feedbackController");

// All routes require authentication
router.use("/", authMiddleware);

// App initialization endpoint - returns expenses, quota, budget, and feature flags
router.get("/init", appController.initializeApp);

// Add feedback/AI expense report endpoint
router.post("/report-ai-expense", feedbackController.reportAiExpense);

module.exports = router;
