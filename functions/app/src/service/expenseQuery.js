const Expense = require("../models/expense.js");
const dbService = require("../db/firestore.js");
const { getNowInIndiaTimezone } = require("../utils/date.js");

// Get total spent in a category and/or time period
const getTotalSpent = async (userId, { category, startDate, endDate }) => {
  console.log("getTotalSpent", userId, category, startDate, endDate);
  const expenses = await dbService.getExpenses(userId, startDate, endDate);
  const filtered = category
    ? expenses.filter((e) => e.category === category)
    : expenses;
  const total = filtered.reduce((sum, e) => sum + (e.amount || 0), 0);
  return { total };
};

// Get expenses, optionally filtered
const getExpenses = async (
  userId,
  { category, startDate, endDate, minAmount, maxAmount }
) => {
  let expenses = await dbService.getExpenses(userId, startDate, endDate);
  if (category) expenses = expenses.filter((e) => e.category === category);
  if (minAmount !== undefined)
    expenses = expenses.filter((e) => e.amount >= minAmount);
  if (maxAmount !== undefined)
    expenses = expenses.filter((e) => e.amount <= maxAmount);
  return expenses.map((obj) => new Expense(obj));
};

// Get summary by category or time period
const getExpenseSummary = async (
  userId,
  { groupBy = "category", startDate, endDate }
) => {
  const expenses = await dbService.getExpenses(userId, startDate, endDate);
  if (groupBy === "category") {
    const summary = {};
    for (const e of expenses) {
      summary[e.category] = (summary[e.category] || 0) + (e.amount || 0);
    }
    return summary;
  } else if (groupBy === "month") {
    const summary = {};
    for (const e of expenses) {
      const month = new Date(e.date).toISOString().slice(0, 7); // YYYY-MM
      summary[month] = (summary[month] || 0) + (e.amount || 0);
    }
    return summary;
  } else if (groupBy === "week") {
    const summary = {};
    for (const e of expenses) {
      const d = new Date(e.date);
      const week = `${d.getFullYear()}-W${Math.ceil((d.getDate() - d.getDay() + 1) / 7)}`;
      summary[week] = (summary[week] || 0) + (e.amount || 0);
    }
    return summary;
  }
  return {};
};

// Get largest expense
const getLargestExpense = async (userId, { category, startDate, endDate }) => {
  let expenses = await dbService.getExpenses(userId, startDate, endDate);
  if (category) expenses = expenses.filter((e) => e.category === category);
  if (expenses.length === 0) return null;
  const largest = expenses.reduce(
    (max, e) => (e.amount > max.amount ? e : max),
    expenses[0]
  );
  return new Expense(largest);
};

// Get recurring expenses (simple: same description/category, >1 occurrence)
const getRecurringExpenses = async (userId) => {
  const expenses = await dbService.getExpenses(userId);
  const map = {};
  for (const e of expenses) {
    const key = `${e.category}|${e.description}`;
    map[key] = (map[key] || 0) + 1;
  }
  const recurring = expenses.filter(
    (e) => map[`${e.category}|${e.description}`] > 1
  );
  // Remove duplicates
  const seen = new Set();
  const unique = [];
  for (const e of recurring) {
    const key = `${e.category}|${e.description}`;
    if (!seen.has(key)) {
      unique.push(new Expense(e));
      seen.add(key);
    }
  }
  return unique;
};

module.exports = {
  getTotalSpent,
  getExpenses,
  getExpenseSummary,
  getLargestExpense,
  getRecurringExpenses,
};
