const express = require("express");
const router = express.Router();
const appController = require("../controllers/appController");
const authMiddleware = require("../middleware/auth");

// All routes require authentication
router.use("/", authMiddleware);

// App initialization endpoint - returns expenses, quota, budget, and feature flags
router.get("/init", appController.initializeApp);

module.exports = router;
