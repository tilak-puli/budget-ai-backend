const axios = require("axios");

// Your test sender phone number
const sender_phone_id = 167914476401345;

function createMessageConfig(recipient_number, expense) {
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
        XMLDocumentAuthorization: "Bearer EAAMsZBTN7YfEBO5fqxWcZBT2imUcG4GGnUCWBejccImAfZAdeUVtDOLlJ8MPQluS2pyb2kprGvvV0kDSuDElZA6vvnkdHRKzVCbJAwAHKoXZA6jAjKoiFYduCdD3jvAkM8WnsIVtFMRVLJRTiiucnZB2sZCsXYJhjB2vsZALW7ZB1CeAcYhZBtB96MbEFk8XW6k5ctgvQpQnpZC8oX4NSXXvfIVdGypQ9y4",
    },
    data: data,
  };

  return config;
}

async function send_expense_message(recipient_number, expense) {
  console.log("Sending message to " + recipient_number)
  axios
    .request(createMessageConfig(recipient_number, expense))
    .then((response) => {
      console.log(JSON.stringify(response.data));
    })
    .catch((error) => {
      console.log(error);
    });
}

module.exports = { send_expense_message }
