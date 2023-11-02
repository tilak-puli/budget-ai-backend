const express = require('express')
const OpenAI = require("openai");
const API_KEY = "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"

const app = express()
const port = 3000

// const configuration = new Configuration({
//   apiKey: API_KEY,
// });

const openai = new OpenAI({ apiKey: API_KEY });

const tryCompletion = async () => {
  const response = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [{
      "role": "system",
      "content": "As a expense tracker. Respond in json format of the expense with category, amount, notes."
    },
      {"role": "user", "content": "Swiggy lunch 500."}]
  });
  console.log(JSON.stringify(response));
}

tryCompletion()
