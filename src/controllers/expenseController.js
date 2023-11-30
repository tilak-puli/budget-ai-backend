const Expense = require("../models/expense.js");
const { send_expense_message, send_message } = require("../plugins/whatsapp.js")
const expenseService = require("../service/expense.js");
const { getNowInIndiaTimezone } = require("../utils/date.js");

const getExpenses = async (req, res) => {
  console.log("request to get expenses");

  const date = getNowInIndiaTimezone()
  const fromDate = req.query.fromDate ? new Date(req.query.fromDate) :  new Date(date.getFullYear(), date.getMonth(), 1);
  const toDate = req.query.toDate ? new Date(req.query.toDate) : new Date(date.getFullYear(), date.getMonth() + 1, 0);

  const expenses = await expenseService.getExpenses(fromDate, toDate);

  res.json(expenses);
};

const createExpense = async (req, res) => {
  const { category, date, description, amount} = req.body?.expense || {};

  if(!category || !date || !description || amount === undefined) {
    return res.status(400).send("Invalid Expense")
  }

  const expense = await expenseService.createExpense(category, description, amount, date);

  res.json(expense);
}

const updateExpense = async (req, res) => {
  console.log("update expense with " + JSON.stringify(req.body));
  const { _id, category, date, description, amount} = req.body?.expense || {};

  if(!category || !date || !description || amount === undefined || !_id) {
    return res.status(400).send("Invalid Expense")
  }

  const updatedExpense = await expenseService.updateExpense(_id, category, description, amount, new Date(date));

  if(!updatedExpense) {
    return res.status(400).send("Expense Not Found")
  }
  
  res.json(updatedExpense);
}

const deleteExpense = async (req, res) => {
  const { id } = req.body || {};

  const deleted = await expenseService.deleteExpense(id);

  res.json({deleted})
}

const addAiExpenseWithMessage = async (req, res) => {
  console.log("request to add expense + ", JSON.stringify(req.body));
  const { expense, errorMessage } = await expenseService.generateExpense(req?.body?.userMessage);

  if(errorMessage) {
    res.status(500).send({errorMessage})
  }

  const id = await expenseService.save(expense);

  res.json({...expense, id});
};

const whastappVerification = async (req, res) => {
  res.send(req.query["hub.challenge"])
}

const handleMessage = async message => {
  const from = message?.from;
  const messageText = message?.text?.body
  console.log("Message is " + message?.text?.body);
  console.log("Message is from" + message?.from);

  send_message(message.from, "Creating expense...")

  const { expense, errorMessage} = await expenseService.generateExpense(messageText);

  if(errorMessage) {
    console.log("Error in generating expense:" + errorMessage)
    send_message(from, errorMessage)
     return;
  }

  await expenseService.save(expense);

  // const expense = new Expense({description:"test", category: "test", amount: 100, createdAt: new Date(), date: "hj"})
  if (from) {
    console.log(`Sending expense: ${JSON.stringify(expense)} message to ${from}`)
    send_expense_message(from, expense)
  } else {
    console.log("No from to send")
  }
}

const addAiExpenseFromWhatsapp = async (req, res) => {
  console.log("Whatsapp message " + JSON.stringify(req.body));

  if (req.body?.object === "whatsapp_business_account") {
    const messages = getMessages(req.body);

    if (!messages || !Array.isArray(messages)) {
      console.log("No message found")
    }

    console.log("messages " + messages)

    messages?.forEach(handleMessage)

  } else {
    console.log("Not a whatsapp message")
    return res.sendStatus(400)
  }

  res.sendStatus(200)
}

function getMessages(body) {
  const entry = body?.entry[0];
  const messages = entry?.changes?.[0]?.value?.messages;

  return messages;
}


module.exports = {
  getExpenses,
  addAiExpenseWithMessage,
  addAiExpenseFromWhatsapp,
  whastappVerification,
  createExpense,
  updateExpense,
  deleteExpense
};
