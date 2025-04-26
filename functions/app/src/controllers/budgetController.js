const Budget = require("../models/budget");
const budgetDb = require("../db/budgetDb");
const { getNowInIndiaTimezone } = require("../utils/date");
const { Firestore } = require("@google-cloud/firestore");
const firestore = new Firestore();
const expenseService = require("../service/expense");

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
 * Calculate the total budget from category budgets
 */
const calculateTotalFromCategories = (categoryBudgets) => {
  return Object.values(categoryBudgets).reduce(
    (sum, amount) => sum + parseFloat(amount || 0),
    0
  );
};

/**
 * Get budget for the user (doesn't create one if it doesn't exist)
 */
const getBudget = async (req, res) => {
  try {
    const userId = req.firebaseToken?.user_id;

    if (!userId) {
      return res.status(400).json({ errorMessage: "Invalid User" });
    }

    // Get budget for the user (without creating if it doesn't exist)
    const budget = await budgetDb.getBudget(userId);

    // If no budget exists, return a default configuration
    if (!budget) {
      const defaultBudget = getDefaultBudgetConfig();

      return res.json({
        success: true,
        budget: defaultBudget,
        categories: Budget.CATEGORIES, // Return available categories
        budgetExists: false,
      });
    }

    res.json({
      success: true,
      budget: {
        totalBudget: budget.totalBudget,
        categoryBudgets: budget.categoryBudgets,
        _id: budget._id,
      },
      categories: Budget.CATEGORIES, // Return available categories
      budgetExists: true,
    });
  } catch (error) {
    console.error("Error getting budget:", error);
    res.status(500).json({
      success: false,
      errorMessage: "Failed to get budget information",
      error: error.message,
    });
  }
};

/**
 * Update total budget
 */
const updateTotalBudget = async (req, res) => {
  try {
    const userId = req.firebaseToken?.user_id;

    if (!userId) {
      return res.status(400).json({ errorMessage: "Invalid User" });
    }

    const { totalBudget } = req.body;

    if (totalBudget === undefined) {
      return res.status(400).json({
        success: false,
        errorMessage: "Total budget amount is required",
      });
    }

    // Check if budget already exists
    let budget = await budgetDb.getBudget(userId);

    if (!budget) {
      // If budget doesn't exist, create one with default values for categories
      const defaultBudget = getDefaultBudgetConfig();

      // Scale the category budgets to match the desired total
      const scaleFactor = parseFloat(totalBudget) / defaultBudget.totalBudget;
      const scaledCategoryBudgets = {};

      // Scale each category budget proportionally
      Object.entries(defaultBudget.categoryBudgets).forEach(
        ([category, amount]) => {
          scaledCategoryBudgets[category] = Math.round(
            parseFloat(amount) * scaleFactor
          );
        }
      );

      // Create a new budget with scaled category values
      const budgetsRef = firestore.collection("budgets");
      const newBudgetData = {
        userId,
        totalBudget: parseFloat(totalBudget),
        categoryBudgets: scaledCategoryBudgets,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const docRef = await budgetsRef.add(newBudgetData);

      // Create a budget object from the data
      budget = new Budget({
        _id: docRef.id,
        ...newBudgetData,
      });
    } else {
      // If budget exists, scale all category budgets proportionally
      const currentTotal = calculateTotalFromCategories(budget.categoryBudgets);
      const scaleFactor = parseFloat(totalBudget) / (currentTotal || 1); // Avoid division by zero

      const scaledCategoryBudgets = {};
      Object.entries(budget.categoryBudgets).forEach(([category, amount]) => {
        scaledCategoryBudgets[category] = Math.round(
          parseFloat(amount || 0) * scaleFactor
        );
      });

      // Update both total and all category budgets
      const budgetsRef = firestore.collection("budgets");
      await budgetsRef.doc(budget._id).update({
        totalBudget: parseFloat(totalBudget),
        categoryBudgets: scaledCategoryBudgets,
        updatedAt: new Date(),
      });

      // Update our local budget object
      budget.totalBudget = parseFloat(totalBudget);
      budget.categoryBudgets = scaledCategoryBudgets;
      budget.updatedAt = new Date();
    }

    res.json({
      success: true,
      budget: {
        totalBudget: budget.totalBudget,
        categoryBudgets: budget.categoryBudgets,
        _id: budget._id,
      },
    });
  } catch (error) {
    console.error("Error updating total budget:", error);
    res.status(500).json({
      success: false,
      errorMessage: "Failed to update total budget",
      error: error.message,
    });
  }
};

/**
 * Update category budget
 */
const updateCategoryBudget = async (req, res) => {
  try {
    const userId = req.firebaseToken?.user_id;

    if (!userId) {
      return res.status(400).json({ errorMessage: "Invalid User" });
    }

    const { category, amount } = req.body;

    if (!category || amount === undefined) {
      return res.status(400).json({
        success: false,
        errorMessage: "Category and amount are required",
      });
    }

    // Validate category
    if (!Budget.CATEGORIES.includes(category)) {
      return res.status(400).json({
        success: false,
        errorMessage: "Invalid category",
        validCategories: Budget.CATEGORIES,
      });
    }

    // Check if budget already exists
    let budget = await budgetDb.getBudget(userId);

    if (!budget) {
      // If budget doesn't exist, create one with default values
      const defaultBudget = getDefaultBudgetConfig();

      // Create a new budget with default values in database
      const budgetsRef = firestore.collection("budgets");

      // Set the user's specified category amount
      const categoryBudgets = { ...defaultBudget.categoryBudgets };
      categoryBudgets[category] = parseFloat(amount) || 0;

      // Calculate new total as sum of all categories
      const newTotal = calculateTotalFromCategories(categoryBudgets);

      const newBudgetData = {
        userId,
        totalBudget: newTotal,
        categoryBudgets: categoryBudgets,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const docRef = await budgetsRef.add(newBudgetData);

      // Create a budget object from the data
      budget = new Budget({
        _id: docRef.id,
        ...newBudgetData,
      });
    } else {
      // Now update just the specified category
      const budgetsRef = firestore.collection("budgets");

      // Update the category in our local budget object first
      budget.categoryBudgets[category] = parseFloat(amount) || 0;

      // Recalculate the total
      const newTotal = calculateTotalFromCategories(budget.categoryBudgets);

      // Update both the category and the total in Firestore
      await budgetsRef.doc(budget._id).update({
        [`categoryBudgets.${category}`]: parseFloat(amount) || 0,
        totalBudget: newTotal,
        updatedAt: new Date(),
      });

      // Update local budget object with new total
      budget.totalBudget = newTotal;
      budget.updatedAt = new Date();
    }

    res.json({
      success: true,
      budget: {
        totalBudget: budget.totalBudget,
        categoryBudgets: budget.categoryBudgets,
        _id: budget._id,
      },
    });
  } catch (error) {
    console.error("Error updating category budget:", error);
    res.status(500).json({
      success: false,
      errorMessage: "Failed to update category budget",
      error: error.message,
    });
  }
};

/**
 * Update multiple category budgets at once
 */
const updateMultipleCategoryBudgets = async (req, res) => {
  try {
    const userId = req.firebaseToken?.user_id;

    if (!userId) {
      return res.status(400).json({ errorMessage: "Invalid User" });
    }

    const { categoryBudgets } = req.body;

    if (!categoryBudgets || typeof categoryBudgets !== "object") {
      return res.status(400).json({
        success: false,
        errorMessage: "Category budgets object is required",
      });
    }

    // Check if budget already exists
    let budget = await budgetDb.getBudget(userId);

    if (!budget) {
      // If budget doesn't exist, create one with default values
      const defaultBudget = getDefaultBudgetConfig();

      // Start with default budget values
      const newCategoryBudgets = { ...defaultBudget.categoryBudgets };

      // Override with user-specified values
      for (const [category, amount] of Object.entries(categoryBudgets)) {
        // Skip invalid categories
        if (!Budget.CATEGORIES.includes(category)) continue;
        newCategoryBudgets[category] = parseFloat(amount) || 0;
      }

      // Calculate total as sum of all categories
      const newTotal = calculateTotalFromCategories(newCategoryBudgets);

      // Create a new budget with combined values
      const budgetsRef = firestore.collection("budgets");
      const newBudgetData = {
        userId,
        totalBudget: newTotal,
        categoryBudgets: newCategoryBudgets,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const docRef = await budgetsRef.add(newBudgetData);

      // Create a budget object from the data
      budget = new Budget({
        _id: docRef.id,
        ...newBudgetData,
      });
    } else {
      // If budget exists, update only the specified categories
      const budgetsRef = firestore.collection("budgets");

      // Update object to be sent to Firestore
      const updates = {
        updatedAt: new Date(),
      };

      // Make a copy of existing category budgets
      const updatedCategoryBudgets = { ...budget.categoryBudgets };

      // Process each category in the request
      for (const [category, amount] of Object.entries(categoryBudgets)) {
        // Skip invalid categories
        if (!Budget.CATEGORIES.includes(category)) continue;

        // Add to the Firestore update
        updates[`categoryBudgets.${category}`] = parseFloat(amount) || 0;

        // Update our local budget object
        updatedCategoryBudgets[category] = parseFloat(amount) || 0;
      }

      // Calculate the new total
      const newTotal = calculateTotalFromCategories(updatedCategoryBudgets);
      updates.totalBudget = newTotal;

      // Update in Firestore
      await budgetsRef.doc(budget._id).update(updates);

      // Update our local budget object
      budget.categoryBudgets = updatedCategoryBudgets;
      budget.totalBudget = newTotal;
      budget.updatedAt = new Date();
    }

    res.json({
      success: true,
      budget: {
        totalBudget: budget.totalBudget,
        categoryBudgets: budget.categoryBudgets,
        _id: budget._id,
      },
    });
  } catch (error) {
    console.error("Error updating category budgets:", error);
    res.status(500).json({
      success: false,
      errorMessage: "Failed to update category budgets",
      error: error.message,
    });
  }
};

/**
 * Delete budget for a specific month
 */
const deleteBudget = async (req, res) => {
  try {
    const userId = req.firebaseToken?.user_id;

    if (!userId) {
      return res.status(400).json({ errorMessage: "Invalid User" });
    }

    const success = await budgetDb.deleteBudget(userId);

    res.json({
      success: true,
      deleted: success,
    });
  } catch (error) {
    console.error("Error deleting budget:", error);
    res.status(500).json({
      success: false,
      errorMessage: "Failed to delete budget",
      error: error.message,
    });
  }
};

/**
 * Get budget summary with actual spending for comparison for the current month
 */
const getBudgetSummary = async (req, res) => {
  try {
    const userId = req.firebaseToken?.user_id;

    if (!userId) {
      return res.status(400).json({ errorMessage: "Invalid User" });
    }

    // Get budget for the user (without creating a budget if it doesn't exist)
    const budget = await budgetDb.getBudget(userId);

    // If no budget exists, use a default budget with suggested allocations
    let budgetToUse;
    if (budget) {
      budgetToUse = budget;
    } else {
      const defaultBudget = getDefaultBudgetConfig();
      budgetToUse = new Budget({
        userId,
        totalBudget: defaultBudget.totalBudget,
        categoryBudgets: defaultBudget.categoryBudgets,
      });
    }

    // Calculate start and end dates for the current month
    const date = getNowInIndiaTimezone();
    const month = date.getMonth() + 1; // 1-12
    const year = date.getFullYear();

    // We can optionally get month/year from query params to view different months
    const queryMonth = req.query.month ? parseInt(req.query.month) : month;
    const queryYear = req.query.year ? parseInt(req.query.year) : year;

    const fromDate = new Date(queryYear, queryMonth - 1, 1); // Month is 0-based in Date constructor
    const toDate = new Date(queryYear, queryMonth, 0); // Last day of the month

    // Get expenses for the specified month
    const expenses = await expenseService.getExpenses(userId, fromDate, toDate);

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

    // Prepare budget vs actual data for response
    const summary = {
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
      month: queryMonth,
      year: queryYear,
      budgetExists: !!budget,
    };

    // Only include _id if budget exists
    if (budget) {
      summary._id = budget._id;
    }

    res.json({
      success: true,
      summary,
    });
  } catch (error) {
    console.error("Error getting budget summary:", error);
    res.status(500).json({
      success: false,
      errorMessage: "Failed to get budget summary",
      error: error.message,
    });
  }
};

module.exports = {
  getBudget,
  updateTotalBudget,
  updateCategoryBudget,
  updateMultipleCategoryBudgets,
  deleteBudget,
  getBudgetSummary,
};
