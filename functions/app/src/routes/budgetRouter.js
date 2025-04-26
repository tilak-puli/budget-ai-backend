const express = require("express");
const router = express.Router();
const budgetController = require("../controllers/budgetController");
const authMiddleware = require("../middleware/auth");

// All routes require authentication
router.use("/", authMiddleware);

// Get budget configuration for user
router.get("/budgets", budgetController.getBudget);

// Get budget summary with spending comparison for a specific month
router.get("/budgets/summary", budgetController.getBudgetSummary);

// Update total budget
router.post("/budgets/total", budgetController.updateTotalBudget);

// Update category budget
router.post("/budgets/category", budgetController.updateCategoryBudget);

// Update multiple category budgets at once
router.post(
  "/budgets/categories",
  budgetController.updateMultipleCategoryBudgets
);

// Delete budget
router.delete("/budgets", budgetController.deleteBudget);

module.exports = router;
