const Expense = require("../models/expense.js");
const dbService = require("../db/firestore.js");

// Helper function to convert date strings to Date objects
const convertDateString = (dateString, isEndDate = false) => {
  if (!dateString) return undefined;
  if (dateString instanceof Date) {
    // If it's already a Date object and it's an end date, set to end of day
    if (isEndDate) {
      const endDate = new Date(dateString);
      endDate.setHours(23, 59, 59, 999);
      return endDate;
    }
    return dateString;
  }

  // Handle YYYY-MM-DD format
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    console.warn(`Invalid date string: ${dateString}`);
    return undefined;
  }

  // If it's an end date, set to end of day (23:59:59.999)
  if (isEndDate) {
    date.setHours(23, 59, 59, 999);
  }

  return date;
};

// Get total spent in a category and/or time period
const getTotalSpent = async (userId, { category, startDate, endDate }) => {
  console.log("getTotalSpent", userId, category, startDate, endDate);

  // Convert date strings to Date objects
  const convertedStartDate = convertDateString(startDate);
  const convertedEndDate = convertDateString(endDate, true);

  const expenses = await dbService.getExpenses(
    userId,
    convertedStartDate,
    convertedEndDate
  );
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
  // Convert date strings to Date objects
  const convertedStartDate = convertDateString(startDate);
  const convertedEndDate = convertDateString(endDate, true); // Set to end of day

  let expenses = await dbService.getExpenses(
    userId,
    convertedStartDate,
    convertedEndDate
  );
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
  // Convert date strings to Date objects
  const convertedStartDate = convertDateString(startDate);
  const convertedEndDate = convertDateString(endDate, true);

  const expenses = await dbService.getExpenses(
    userId,
    convertedStartDate,
    convertedEndDate
  );
  console.log(
    "expenses in getExpenseSummary",
    expenses,
    groupBy,
    startDate,
    endDate,
    convertedStartDate,
    convertedEndDate
  );
  const summary = getInitialSummary(groupBy);
  if (groupBy === "category") {
    for (const e of expenses) {
      summary[e.category] = (summary[e.category] || 0) + (e.amount || 0);
    }
    return summary;
  } else if (groupBy === "month") {
    for (const e of expenses) {
      const month = new Date(e.date).toISOString().slice(0, 7); // YYYY-MM
      summary[month] = (summary[month] || 0) + (e.amount || 0);
    }
    return summary;
  } else if (groupBy === "week") {
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
  // Convert date strings to Date objects
  const convertedStartDate = convertDateString(startDate);
  const convertedEndDate = convertDateString(endDate, true);

  let expenses = await dbService.getExpenses(
    userId,
    convertedStartDate,
    convertedEndDate
  );
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

const getInitialSummary = (groupBy) => {
  if (groupBy === "category")
    return {
      Food: 0,
      Transport: 0,
      Entertainment: 0,
      Shopping: 0,
      Other: 0,
    };
  if (groupBy === "month")
    return {
      January: 0,
      February: 0,
      March: 0,
      April: 0,
      May: 0,
      June: 0,
      July: 0,
      August: 0,
      September: 0,
      October: 0,
      November: 0,
      December: 0,
    };
  if (groupBy === "week")
    return {
      "Week 1": 0,
      "Week 2": 0,
      "Week 3": 0,
      "Week 4": 0,
    };
  return {};
};

module.exports = {
  getTotalSpent,
  getExpenses,
  getExpenseSummary,
  getLargestExpense,
  getRecurringExpenses,
};
