const expenseService = require("../service/expense.js");
const userService = require("../service/userService.js");
const { getNowInIndiaTimezone } = require("../utils/date.js");
const subscriptionDb = require("../db/subscriptionDb");
const Budget = require("../models/budget");
const budgetDb = require("../db/budgetDb");
const configDb = require("../db/configDb");
const budgetController = require("./budgetController");

/**
 * Default budget allocations by category in INR
 */
const DEFAULT_BUDGET_ALLOCATIONS = {
  Food: 5000,
  Transport: 2500,
  Rent: 7500,
  Entertainment: 1250,
  Utilities: 2000,
  Groceries: 2500,
  Shopping: 1250,
  Healthcare: 1250,
  "Personal Care": 500,
  Misc: 500,
  Savings: 0,
  Insurance: 750,
  Lent: 0,
};

/**
 * Calculate the total budget from category budgets
 */
const calculateTotalFromCategories = (categoryBudgets) => {
  return Object.values(categoryBudgets).reduce(
    (sum, amount) => sum + parseFloat(amount || 0),
    0
  );
};

/**
 * Generate default budget configuration with category allocations
 */
const getDefaultBudgetConfig = () => {
  const categoryBudgets = { ...DEFAULT_BUDGET_ALLOCATIONS };
  // Calculate total as sum of all category values
  const totalBudget = calculateTotalFromCategories(categoryBudgets);

  return {
    totalBudget,
    categoryBudgets,
  };
};

/**
 * App initialization endpoint that aggregates data from multiple sources
 * Returns expenses, quota information, budget details, and feature flags
 */
const initializeApp = async (req, res) => {
  try {
    const userId = req.firebaseToken?.user_id;

    if (!userId) {
      return res.status(400).send({ errorMessage: "Invalid User" });
    }

    // ---- Prepare date range for expenses ----
    const date = getNowInIndiaTimezone();
    const fromDate = req.query.fromDate
      ? new Date(req.query.fromDate)
      : new Date(date.getFullYear(), date.getMonth(), 1);
    const toDate = req.query.toDate
      ? new Date(req.query.toDate)
      : new Date(date.getFullYear(), date.getMonth() + 1, 0);

    // ---- Run all data fetching operations in parallel ----
    const [expenses, subscription, budget, config] = await Promise.all([
      // Get expenses
      expenseService.getExpenses(userId, fromDate, toDate),

      // Get subscription info
      subscriptionDb.getSubscriptionByUserId(userId),

      // Get budget
      budgetDb.getBudget(userId),

      // Get configuration
      configDb.getAllConfig(),
    ]);

    // Check subscription status
    const isSubscribed =
      subscription &&
      subscription.status === "active" &&
      subscription.expiryDate > new Date();

    // Get quota information
    const quotaInfo = await userService.checkMessageQuota(userId, isSubscribed);

    // ---- Process budget information ----
    let budgetInfo;
    // If no budget exists, return default configuration
    if (!budget) {
      const defaultBudget = getDefaultBudgetConfig();

      budgetInfo = {
        budget: defaultBudget,
        categories: Budget.CATEGORIES,
        budgetExists: false,
      };
    } else {
      budgetInfo = {
        budget: {
          totalBudget: budget.totalBudget,
          categoryBudgets: budget.categoryBudgets,
          _id: budget._id,
        },
        categories: Budget.CATEGORIES,
        budgetExists: true,
      };
    }

    // ---- Calculate budget summary with actual spending ----
    // Calculate spending by category
    const spendingByCategory = {};
    let totalSpending = 0;

    // Initialize all categories with 0 spending
    Budget.CATEGORIES.forEach((category) => {
      spendingByCategory[category] = 0;
    });

    // Sum up expenses by category
    expenses.forEach((expense) => {
      const category = expense.category;
      const amount = parseFloat(expense.amount) || 0;

      if (spendingByCategory[category] !== undefined) {
        spendingByCategory[category] += amount;
      } else {
        // Handle case where expense has a category not in our standard list
        spendingByCategory[category] = amount;
      }

      totalSpending += amount;
    });

    // Prepare budget vs actual data
    const budgetToUse =
      budget ||
      new Budget({
        userId,
        totalBudget: budgetInfo.budget.totalBudget,
        categoryBudgets: budgetInfo.budget.categoryBudgets,
      });

    const budgetSummary = {
      totalBudget: budgetToUse.totalBudget,
      totalSpending,
      remainingBudget: budgetToUse.totalBudget - totalSpending,
      categories: Budget.CATEGORIES.map((category) => ({
        category,
        budget: budgetToUse.getCategoryBudget(category),
        actual: spendingByCategory[category] || 0,
        remaining:
          budgetToUse.getCategoryBudget(category) -
          (spendingByCategory[category] || 0),
      })),
      month: date.getMonth() + 1,
      year: date.getFullYear(),
      budgetExists: !!budget,
    };

    // ---- Get feature flags from config ----
    // Since we're fetching the entire app_config document, extract the featureFlags
    const featureFlags = config.featureFlags || {};

    // Combine all information into a single response
    res.json({
      expenses,
      quota: {
        hasQuotaLeft: quotaInfo.hasQuotaLeft,
        remainingQuota: quotaInfo.remainingQuota,
        isPremium: quotaInfo.isSubscribed,
        dailyLimit: quotaInfo.dailyLimit,
        standardLimit: userService.FREE_MESSAGES_PER_DAY,
        premiumLimit: userService.PREMIUM_MESSAGES_PER_DAY,
      },
      budget: budgetInfo,
      budgetSummary,
      featureFlags,
      config, // This is now the entire app_config document
      dateRange: {
        fromDate,
        toDate,
      },
    });
  } catch (error) {
    console.error("Error in app initialization:", error);
    res.status(500).json({
      success: false,
      errorMessage: "Failed to initialize app",
      error: error.message,
    });
  }
};

module.exports = {
  initializeApp,
};
