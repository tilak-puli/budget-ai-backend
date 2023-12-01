const axios = require("axios");

// Your test sender phone number
const sender_phone_id = 167914476401345;

function createMessageConfig(recipient_number, message) {
  let config = {
    method: "post",
    maxBodyLength: Infinity,
    url: `https://graph.facebook.com/v17.0/${sender_phone_id}/messages`,
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer EAAMsZBTN7YfEBO2nrQatgetoaG8TJBuxDtL4DrSNivJqZCeJ06iMtoq4vR2fAyhr2z34u4anSZCQZCU1Dh1ETMfh2kthug11VVKH50qFVyvZC5GkH39ZCxc1GGsJuPR5kZAaerZAIydWIAtZBvCg9j3MbUGhfNk1HTjg9PbuuKKacvSLatXfOXZBKZClUbH4BKiPluLJiHo7eyXeX6zqP6XATT3vPAOZAuJ9",
    },
    data: JSON.stringify({
      "messaging_product": "whatsapp",
      "recipient_type": "individual",
      "to": recipient_number,
      "type": "text",
      "text": {
        "preview_url": false,
        "body": message
      }
    }),
  };

  return config;
}

// Not Using cause templates are too slow
function createExpenseMessageConfig(recipient_number, expense) {
  let data = JSON.stringify({
    messaging_product: "whatsapp",
    to: recipient_number,
    type: "template",
    template: {
      name: "expense",
      language: { code: "en_GB" },
      components: [
        {
          type: "body",
          parameters: [
            {
              type: "text",
              text: expense.description,
            },
            {
              type: "text",
              text: `${expense.amount}`,
            },
            {
              type: "text",
              text: expense.category,
            },
            {
              type: "text",
              text: `12/02/20`,
            },
          ],
        },
      ],
    },
  });

  let config = {
    method: "post",
    maxBodyLength: Infinity,
    url: `https://graph.facebook.com/v17.0/${sender_phone_id}/messages`,
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer EAAMsZBTN7YfEBOxfhFyHqAXFCU9ZB2asvD8W7CRNtHrjiIHAAFUbhmDru9I8YZAXNcWVg8n6V1Iyp0aBpUbbQJzHMrgZB12uyRObp3ZCa31ZB9EAT3XR8EqcaXjxGqUQNYDTRYhajHlWfPe695qDNvmzReNRPvvDy0RbfWINDOE1QZAZBg28MgBmZAZAfS8oNMvkiSiZCND61x2yzWIUporjL7k6yz6KNQZD",
    },
    data,
  };

  return config;
}

function expenseText(expense) {
  return `Expense Created

Description: ${expense.description}
Amount: ${expense.amount}
Category: ${expense.category}
Date: ${new Intl.DateTimeFormat('ban').format(expense.createdAt)}

Please use the app to update the expense
`
}

async function send_expense_message(recipient_number, expense) {
  console.log("Sending message to " + recipient_number)
  axios
    .request(createMessageConfig(recipient_number, expenseText(expense)))
    .then((response) => {
      console.log(JSON.stringify(response.data));
    })
    .catch((error) => {
      console.log(error);
    });
}


async function send_message(recipient_number, message) {
  console.log("Sending message to " + recipient_number + " " + message)
  axios
    .request(createMessageConfig(recipient_number, message))
    .then((response) => {
      console.log(JSON.stringify(response.data));
    })
    .catch((error) => {
      console.log(error);
    });
}

module.exports = { send_expense_message, send_message }
