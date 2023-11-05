const { getCompletionForExpense } = require("../ai/ai");
const { getDb } = require("../db/conn.js");
const Expense = require("../models/expense");

const getExpenses = async(req, res) => {
  console.log("request to get expenses");

  const db = getDb()
  const collection = await db.collection("expenses");
  const expenses = await collection.find({}).sort({"date": -1, "createdAt": 1}).toArray()

  res.json(expenses.map((obj) => new Expense(obj)));
};

const addAiExpenseWithMessage = async (req, res) => {
  console.log("request to add expense + ", JSON.stringify(req.body));
  const expenseCompletion = await getCompletionForExpense(
    req?.body?.userMessage
  );
  const expense = new Expense({...expenseCompletion, createdAt: Date.now()});

  console.log("adding expense + ", JSON.stringify(expense));

  const db = getDb()
  const collection = await db.collection("expenses");
  await collection.insertOne(expense);

  res.json(expense);
};

const addAiExpenseFromWhatsapp = async (req, res) => {
  console.log("Got api call on webhook")
  console.log(req)

  res.json("1375022804")
}

module.exports = {
  getExpenses,
  addAiExpenseWithMessage,
  addAiExpenseFromWhatsapp
};
