const Expense = require("../models/expense.js");
const UserMessage = require("../models/userMessage.js");
const {
  send_expense_message,
  send_message,
} = require("../plugins/whatsapp.js");
const expenseService = require("../service/expense.js");
const userService = require("../service/userService.js");
const userMessageService = require("../service/userMessageService.js");
const { getNowInIndiaTimezone } = require("../utils/date.js");
const { getUserByPhoneNumber } = require("../middleware/auth/firebase.js");
const subscriptionDb = require("../db/subscriptionDb.js");

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

  // Check subscription status
  const subscription = await subscriptionDb.getSubscriptionByUserId(userId);
  const isSubscribed =
    subscription &&
    subscription.status === "active" &&
    subscription.expiryDate > new Date();

  // Get quota information
  const quotaInfo = await userService.checkMessageQuota(userId, isSubscribed);

  res.json({
    expenses: expenses,
    quota: {
      hasQuotaLeft: quotaInfo.hasQuotaLeft,
      remainingQuota: quotaInfo.remainingQuota,
      isPremium: quotaInfo.isSubscribed,
      dailyLimit: quotaInfo.dailyLimit,
      standardLimit: userService.FREE_MESSAGES_PER_DAY,
      premiumLimit: userService.PREMIUM_MESSAGES_PER_DAY,
    },
  });
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

  // Check subscription status
  const subscription = await subscriptionDb.getSubscriptionByUserId(userId);
  const isSubscribed =
    subscription &&
    subscription.status === "active" &&
    subscription.expiryDate > new Date();

  // Check if user has quota left
  const quotaInfo = await userService.checkMessageQuota(userId, isSubscribed);

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

  const { expense, errorMessage, askReply } =
    await expenseService.generateExpense(
      userId,
      req?.body?.userMessage,
      req?.body?.date
    );

  // Increment message count
  await userService.incrementMessageCount(userId);

  // Save user message and AI response to userMessages table
  try {
    if (askReply) {
      const userMessage = UserMessage.fromAskReply(
        userId,
        req?.body?.userMessage,
        askReply
      );
      await userMessageService.saveUserMessage(userMessage);
      return res.status(200).json({ askReply });
    }

    if (errorMessage) {
      const userMessage = UserMessage.fromErrorMessage(
        userId,
        req?.body?.userMessage,
        errorMessage
      );
      await userMessageService.saveUserMessage(userMessage);
      return res.status(401).send({ errorMessage });
    }

    // For successful expense creation, also save the user message
    if (expense) {
      const userMessage = UserMessage.fromExpenseResponse(
        userId,
        req?.body?.userMessage,
        expense
      );
      await userMessageService.saveUserMessage(userMessage);
    }
  } catch (messageError) {
    console.error("Error saving user message:", messageError);
    // Don't fail the main request if message saving fails
  }

  const _id = await expenseService.save(expense);

  // Get fresh quota info
  const updatedQuotaInfo = await userService.checkMessageQuota(
    userId,
    isSubscribed
  );

  res.json({
    expense: new Expense({ ...expense, _id }),
    remainingQuota: updatedQuotaInfo.remainingQuota,
    dailyLimit: updatedQuotaInfo.dailyLimit,
    isPremium: updatedQuotaInfo.isSubscribed,
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

  // Check subscription status
  const subscription = await subscriptionDb.getSubscriptionByUserId(userId);
  const isSubscribed =
    subscription &&
    subscription.status === "active" &&
    subscription.expiryDate > new Date();

  // Check if user has quota left
  const quotaInfo = await userService.checkMessageQuota(userId, isSubscribed);

  const { expense, errorMessage, askReply } =
    await expenseService.generateExpense(userId, messageText);
  console.log("expense in handleMessage", { expense, errorMessage, askReply });

  // Save user message and AI response to userMessages table
  try {
    if (askReply) {
      const userMessage = UserMessage.fromAskReply(
        userId,
        messageText,
        askReply
      );
      await userMessageService.saveUserMessage(userMessage);
      // Send askReply via WhatsApp
      send_message(from, askReply);
      return;
    }

    if (errorMessage) {
      const userMessage = UserMessage.fromErrorMessage(
        userId,
        messageText,
        errorMessage
      );
      await userMessageService.saveUserMessage(userMessage);
      console.log("Error in generating expense:" + errorMessage);
      send_message(from, errorMessage);
      return;
    }

    // For successful expense creation, also save the user message
    if (expense) {
      const userMessage = UserMessage.fromExpenseResponse(
        userId,
        messageText,
        expense
      );
      await userMessageService.saveUserMessage(userMessage);
    }
  } catch (messageError) {
    console.error("Error saving user message:", messageError);
    // Don't fail the main request if message saving fails
  }

  // Increment message count
  await userService.incrementMessageCount(userId);

  await expenseService.createExpense(expense);

  if (from) {
    console.log(
      `Sending expense: ${JSON.stringify(expense)} message to ${from}`
    );
    send_expense_message(from, expense);

    // Get fresh quota info
    const updatedQuotaInfo = await userService.checkMessageQuota(
      userId,
      isSubscribed
    );
    const remainingQuota = updatedQuotaInfo.remainingQuota;
    const messageSuffix = isSubscribed
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

const getUserMessages = async (req, res) => {
  console.log("request to get user messages");
  const userId = req.firebaseToken?.user_id;

  if (!userId) {
    return res.status(400).send({ errorMessage: "Invalid User" });
  }

  try {
    const limit = parseInt(req.query.limit) || 50;
    const fromDate = req.query.fromDate ? new Date(req.query.fromDate) : null;
    const toDate = req.query.toDate ? new Date(req.query.toDate) : null;

    const messages = await userMessageService.getUserMessages(
      userId,
      limit,
      fromDate,
      toDate
    );
    const stats = await userMessageService.getMessageStats(
      userId,
      fromDate,
      toDate
    );

    res.json({
      messages,
      stats,
      pagination: {
        limit,
        count: messages.length,
      },
    });
  } catch (error) {
    console.error("Error getting user messages:", error);
    res.status(500).send({ errorMessage: "Failed to retrieve messages" });
  }
};

const getRecentConversation = async (req, res) => {
  console.log("request to get recent conversation");
  const userId = req.firebaseToken?.user_id;

  if (!userId) {
    return res.status(400).send({ errorMessage: "Invalid User" });
  }

  try {
    const limit = parseInt(req.query.limit) || 10;
    const conversation = await userMessageService.getRecentConversation(
      userId,
      limit
    );

    res.json({
      conversation,
      count: conversation.length,
    });
  } catch (error) {
    console.error("Error getting recent conversation:", error);
    res.status(500).send({ errorMessage: "Failed to retrieve conversation" });
  }
};

module.exports = {
  getExpenses,
  addAiExpenseWithMessage,
  addAiExpenseFromWhatsapp,
  whastappVerification,
  createExpense,
  updateExpense,
  deleteExpense,
  getUserMessages,
  getRecentConversation,
};
