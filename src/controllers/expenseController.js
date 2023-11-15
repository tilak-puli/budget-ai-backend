const { getCompletionForExpense } = require("../ai/ai");
const { getDb } = require("../db/conn.js");
const Expense = require("../models/expense");
const { send_expense_message } = require("../plugins/whatsapp.js")

const getExpenses = async (req, res) => {
  console.log("request to get expenses");

  const db = getDb()
  const collection = await db.collection("expenses");
  const expenses = await collection.find({}).sort({ "date": -1, "createdAt": 1 }).toArray()

  res.json(expenses.map((obj) => new Expense(obj)));
};

const addAiExpenseWithMessage = async (req, res) => {
  console.log("request to add expense + ", JSON.stringify(req.body));
  const expenseCompletion = await getCompletionForExpense(
    req?.body?.userMessage
  );
  const expense = new Expense({ ...expenseCompletion, createdAt: Date.now() });

  console.log("adding expense + ", JSON.stringify(expense));

  const db = getDb()
  const collection = await db.collection("expenses");
  await collection.insertOne(expense);

  res.json(expense);
};

const whastappVerification = async (req, res) => {
  res.send(req.query["hub.challenge"])
}


const addAiExpenseFromWhatsapp = async (req, res) => {
  console.log("Whatsapp message " + JSON.stringify(req.body));

  if (req.body?.object === "whatsapp_business_account") {
    const entry = req.body?.entry[0];
    const messages = entry?.changes?.[0]?.value?.messages;
    console.log("entry " + JSON.stringify(entry))
    console.log("messages " + messages)

    if (Array.isArray(messages)) {
      messages.forEach(message => {
        console.log("Message is " + message?.text?.body);
        console.log("Message is from" + message?.from);

        if (message.from) {
          send_expense_message(message.from, new Expense("Test expense", 100, "test", new Date()))
        }
      })
    }
  }

  res.sendStatus(200)
}

module.exports = {
  getExpenses,
  addAiExpenseWithMessage,
  addAiExpenseFromWhatsapp,
  whastappVerification
};
