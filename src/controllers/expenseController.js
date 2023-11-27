const Expense = require("../models/expense.js");
const { send_expense_message, send_message } = require("../plugins/whatsapp.js")
const expenseService = require("../service/expense.js")

const getExpenses = async (req, res) => {
  console.log("request to get expenses");

  const expenses = await expenseService.getExpenses();

  res.json(expenses);
};

const addAiExpenseWithMessage = async (req, res) => {
  console.log("request to add expense + ", JSON.stringify(req.body));
  const { expense, errorMessage } = await expenseService.generateExpense(req?.body?.userMessage);

  if(errorMessage) {
    res.status(500).send({errorMessage})
  }

  await expenseService.save(expense);

  res.json({expense});
};

const whastappVerification = async (req, res) => {
  res.send(req.query["hub.challenge"])
}


const addAiExpenseFromWhatsapp = async (req, res) => {
  console.log("Whatsapp message " + JSON.stringify(req.body));

  if (req.body?.object === "whatsapp_business_account") {
    const messages = getMessages(req.body);

    if (!messages || !Array.isArray(messages)) {
      console.log("No message found")
    }

    console.log("messages " + messages)

    messages?.forEach(async message => {
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
    })

  } else {
    console.log("Not a whatsapp message")
    return res.sendStatus(400)
  }

  res.sendStatus(200)
}

module.exports = {
  getExpenses,
  addAiExpenseWithMessage,
  addAiExpenseFromWhatsapp,
  whastappVerification
};

function getMessages(body) {
  const entry = body?.entry[0];
  const messages = entry?.changes?.[0]?.value?.messages;

  return messages;
}

