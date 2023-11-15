const { send_expense_message } = require("../plugins/whatsapp.js")
const expenseService = require("../service/expense.js")

const getExpenses = async (req, res) => {
  console.log("request to get expenses");

  const expenses = await expenseService.getExpenses();

  res.json(expenses);
};

const addAiExpenseWithMessage = async (req, res) => {
  console.log("request to add expense + ", JSON.stringify(req.body));
  const expense = await expenseService.generateExpense(req?.body?.userMessage);
  await expenseService.save(expense);

  res.json(expense);
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

      const expense = await expenseService.generateExpense(messageText);
      await expenseService.save(expense);

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

