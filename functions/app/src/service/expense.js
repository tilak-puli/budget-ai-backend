const { getCompletionForExpense } = require("../utils/ai.js");
const {
  getCompletionForExpenseWithUnifiedLangChain,
} = require("../utils/langchain/unified-index.js");
const Expense = require("../models/expense.js");
const { getNowInIndiaTimezone } = require("../utils/date.js");
const dbService = require("../db/firestore.js");

const save = async (expense) => {
  return await dbService.save(expense);
};

const generateExpense = async (userId, message, date) => {
  const response = await getCompletionForExpenseWithUnifiedLangChain(
    message,
    userId
  );

  console.log("response in generateExpense", response);
  const now = getNowInIndiaTimezone();

  try {
    if (response.error?.message) {
      return { errorMessage: response.error.message };
    }
    if (response.askReply) {
      return { askReply: response.askReply };
    }
    const expenseObj = response.expense;
    // Fix this by validating date instead
    // if (!expenseObj.date || expenseObj.date === "null") {
    // Todo: find a way to get proper date from chatgpt
    if (date) {
      expenseObj.date = new Date(date);
    } else {
      expenseObj.date = now;
    }
    // }

    const expense = new Expense({
      ...expenseObj,
      createdAt: now,
      prompt: message,
      userId,
    });
    return { expense };
  } catch {
    return { errorMessage: response };
  }
};

const getExpenses = async (userId, fromDate, toDate) => {
  const rows = await dbService.getExpenses(userId, fromDate, toDate);

  console.log(rows);

  return rows.map((obj) => new Expense(obj));
};

const createExpense = async (userId, category, description, amount, date) => {
  const _id = dbService.createExpense(
    userId,
    category,
    description,
    amount,
    date,
    getNowInIndiaTimezone()
  );

  return new Expense({ _id, userId, category, description, amount, date });
};

const updateExpense = async (
  userId,
  id,
  category,
  description,
  amount,
  date
) => {
  const updatedExpense = await dbService.updateExpense(
    userId,
    id,
    category,
    description,
    amount,
    date,
    getNowInIndiaTimezone()
  );

  if (updatedExpense) {
    return new Expense(updatedExpense);
  }

  return null;
};

const deleteExpense = async (userId, id) => {
  const deletedCount = dbService.deleteExpense(userId, id);

  if (deletedCount === 1) {
    console.log("Successfully deleted one expense.");
    return true;
  }

  console.log(`No documents matched the delete query.`);
  return false;
};

module.exports = {
  save,
  generateExpense,
  getExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
};
