const axios = require("axios");

// Your test sender phone number
const sender_phone_id = 167914476401345;

// Enter the recipient phone number
const recipient_number = "917893363123";

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
            text: "Swiggy Food",
          },
          {
            type: "text",
            text: "100",
          },
          {
            type: "text",
            text: "Food",
          },
          {
            type: "text",
            text: "20/01/2023",
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
    Authorization:
      "Bearer EAAMsZBTN7YfEBO8kgJT2gLfMeZAqRqzS7ZAMttfWGBd8qWES8Um4G1EBJzZCbgNfUTRVFsJZCmSZCWtp4vwzjR7EAJgPKIIoBIbu2hWZABV4ROs1ATBBciVxtak9PaMLStD8r1xYx5QIuei6sNwR4OLDHIn3D65Lq94aEHDfNJsT7nZCMYXftod5jqA9NgiT6yE8WENmtEyUmZBWL5QnvMNMxdu4Wam4ZD",
  },
  data: data,
};

async function send_expense_message() {
  axios
    .request(config)
    .then((response) => {
      console.log(JSON.stringify(response.data));
    })
    .catch((error) => {
      console.log(error);
    });
}

module.exports = { send_expense_message }
