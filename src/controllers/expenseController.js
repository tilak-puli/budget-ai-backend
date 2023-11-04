const { getCompletionForExpense } = require("../ai/ai");
const { getDb } = require("../db/conn.js");
const Expense = require("../models/expense");

const getExpenses = async(req, res) => {
  console.log("request to get expenses");

  const db = getDb()
  const collection = await db.collection("expenses");
  const expenses = await collection.find({}).sort({"date"}).toArray()

  res.json(expenses.map((obj) => new Expense(obj)));
};

const addAiExpenseWithMessage = async (req, res) => {
  console.log("request to add expense + ", JSON.stringify(req.body));
  const expenseCompletion = await getCompletionForExpense(
    req?.body?.userMessage
  );
  const expense = new Expense(expenseCompletion);

  console.log("adding expense + ", JSON.stringify(expense));

  const db = getDb()
  const collection = await db.collection("expenses");
  await collection.insertOne(expense);

  res.json(expense);
};

module.exports = {
  getExpenses,
  addAiExpenseWithMessage,
};
