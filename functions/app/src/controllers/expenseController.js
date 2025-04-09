const Expense = require("../models/expense.js");
const {
  send_expense_message,
  send_message,
} = require("../plugins/whatsapp.js");
const expenseService = require("../service/expense.js");
const messageQuotaService = require("../service/messageQuotaService.js");
const { getNowInIndiaTimezone } = require("../utils/date.js");
const { getUserByPhoneNumber } = require("../middleware/auth/firebase.js");

const getExpenses = async (req, res) => {
  console.log("request to get expenses");
  const userId = req.firebaseToken?.user_id;

  if (!userId) {
    res.status(400).send({ errorMessage: "Invalid User" });
  }

  const date = getNowInIndiaTimezone();
  const fromDate = req.query.fromDate
    ? new Date(req.query.fromDate)
    : new Date(date.getFullYear(), date.getMonth(), 1);
  const toDate = req.query.toDate
    ? new Date(req.query.toDate)
    : new Date(date.getFullYear(), date.getMonth() + 1, 0);

  const expenses = await expenseService.getExpenses(userId, fromDate, toDate);

  res.json(expenses);
};

const createExpense = async (req, res) => {
  const userId = req.firebaseToken?.user_id;

  if (!userId) {
    res.status(400).send({ errorMessage: "Invalid User" });
  }

  const { category, date, description, amount } = req.body?.expense || {};

  if (!category || !date || !description || amount === undefined) {
    return res.status(400).send("Invalid Expense");
  }

  const expense = await expenseService.createExpense(
    userId,
    category,
    description,
    amount,
    date
  );

  res.json(expense);
};

const updateExpense = async (req, res) => {
  console.log("update expense with " + JSON.stringify(req.body));
  const userId = req.firebaseToken?.user_id;

  if (!userId) {
    res.status(400).send({ errorMessage: "Invalid User" });
  }
  const { _id, category, date, description, amount } = req.body?.expense || {};

  if (!category || !date || !description || amount === undefined || !_id) {
    return res.status(400).send("Invalid Expense");
  }

  const updatedExpense = await expenseService.updateExpense(
    userId,
    _id,
    category,
    description,
    amount,
    new Date(date)
  );

  if (!updatedExpense) {
    return res.status(400).send("Expense Not Found");
  }

  res.json(updatedExpense);
};

const deleteExpense = async (req, res) => {
  const { id } = req.body || {};
  const userId = req.firebaseToken?.user_id;

  if (!userId) {
    res.status(400).send({ errorMessage: "Invalid User" });
  }

  const deleted = await expenseService.deleteExpense(userId, id);

  res.json({ deleted });
};

const addAiExpenseWithMessage = async (req, res) => {
  console.log("request to add expense + ", JSON.stringify(req.body));
  const userId = req.firebaseToken?.user_id;

  if (!userId) {
    return res.status(400).send({ errorMessage: "Invalid User" });
  }

  // Check if user has quota left
  const quotaInfo = await messageQuotaService.checkMessageQuota(userId);

  if (!quotaInfo.hasQuotaLeft) {
    return res.status(403).send({
      errorMessage: `Daily message limit (${quotaInfo.dailyLimit}) reached. ${
        quotaInfo.isSubscribed
          ? "Your premium account allows 100 AI messages per day."
          : "Upgrade to premium for 100 AI messages per day."
      }`,
      quotaExceeded: true,
      remainingQuota: quotaInfo.remainingQuota,
      dailyLimit: quotaInfo.dailyLimit,
      isPremium: quotaInfo.isSubscribed,
    });
  }

  const { expense, errorMessage } = await expenseService.generateExpense(
    userId,
    req?.body?.userMessage,
    req?.body?.date
  );

  if (errorMessage) {
    return res.status(401).send({ errorMessage });
  }

  // Increment message count for all users
  await messageQuotaService.incrementMessageCount(userId);

  const _id = await expenseService.save(expense);

  res.json({
    expense: new Expense({ ...expense, _id }),
    remainingQuota: quotaInfo.remainingQuota - 1,
    dailyLimit: quotaInfo.dailyLimit,
    isPremium: quotaInfo.isSubscribed,
  });
};

const whastappVerification = async (req, res) => {
  res.send(req.query["hub.challenge"]);
};

const handleMessage = async (message) => {
  const from = message?.from;
  const messageText = message?.text?.body;
  console.log("Message is " + message?.text?.body);
  console.log("Message is from" + message?.from);

  const { firebaseUser, errorMessage: userErrorMessage } =
    await getUserByPhoneNumber(from);

  if (userErrorMessage) {
    return send_message(
      message.from,
      "Please signup before using our services"
    );
  }

  const userId = firebaseUser.uid;

  // Check if user has quota left
  const quotaInfo = await messageQuotaService.checkMessageQuota(userId);

  if (!quotaInfo.hasQuotaLeft) {
    return send_message(
      from,
      `Daily message limit (${quotaInfo.dailyLimit}) reached. ${
        quotaInfo.isSubscribed
          ? "Your premium account allows 100 AI messages per day."
          : "Upgrade to premium for 100 AI messages per day."
      }`
    );
  }

  send_message(message.from, "Creating expense...");

  const { expense, errorMessage } = await expenseService.generateExpense(
    userId,
    messageText
  );

  if (errorMessage) {
    console.log("Error in generating expense:" + errorMessage);
    send_message(from, errorMessage);
    return;
  }

  // Increment message count for all users
  await messageQuotaService.incrementMessageCount(userId);

  await expenseService.createExpense(expense);

  if (from) {
    console.log(
      `Sending expense: ${JSON.stringify(expense)} message to ${from}`
    );
    send_expense_message(from, expense);

    // Send remaining quota information to all users
    const remainingQuota = quotaInfo.remainingQuota - 1;
    const messageSuffix = quotaInfo.isSubscribed
      ? " with your premium account."
      : " today. Upgrade to premium for 100 AI messages per day.";

    send_message(
      from,
      `You have ${remainingQuota} AI messages left${messageSuffix}`
    );
  } else {
    console.log("No from to send");
  }
};

const addAiExpenseFromWhatsapp = async (req, res) => {
  console.log("Whatsapp message " + JSON.stringify(req.body));

  if (req.body?.object === "whatsapp_business_account") {
    const messages = getMessages(req.body);

    if (!messages || !Array.isArray(messages)) {
      console.log("No message found");
    }

    console.log("messages " + messages);

    messages?.forEach(handleMessage);
  } else {
    console.log("Not a whatsapp message");
    return res.sendStatus(400);
  }

  res.sendStatus(200);
};

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
  deleteExpense,
};
