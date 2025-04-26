class Budget {
  constructor({
    _id,
    userId,
    totalBudget = 0,
    categoryBudgets = {},
    createdAt,
    updatedAt,
  }) {
    this._id = _id;
    this.userId = userId;
    this.totalBudget = parseFloat(totalBudget) || 0;

    // Store category-specific budgets
    this.categoryBudgets = categoryBudgets || {};

    this.createdAt = createdAt ? new Date(createdAt) : new Date();
    this.updatedAt = updatedAt ? new Date(updatedAt) : new Date();
  }

  // Get budget for a specific category
  getCategoryBudget(category) {
    return this.categoryBudgets[category] || 0;
  }

  // Set budget for a specific category
  setCategoryBudget(category, amount) {
    this.categoryBudgets[category] = parseFloat(amount) || 0;
    this.updatedAt = new Date();
  }

  // Update the total budget
  setTotalBudget(amount) {
    this.totalBudget = parseFloat(amount) || 0;
    this.updatedAt = new Date();
  }
}

// List of valid expense categories
Budget.CATEGORIES = [
  "Food",
  "Transport",
  "Rent",
  "Entertainment",
  "Utilities",
  "Groceries",
  "Shopping",
  "Healthcare",
  "Personal Care",
  "Misc",
  "Savings",
  "Insurance",
  "Lent",
];

module.exports = Budget;
