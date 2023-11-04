const OpenAI = require("openai");
const API_KEY = process.env.OPENAI_API_KEY;
const openai = new OpenAI({ apiKey: API_KEY });

const SYSTEM_MESSAGE =
  "As a expense tracker. In json, respond with expense {category, amount, description, date}. today date is: ";

const getCompletionForExpense = async (userMessage) => {
  const completion = await getCompletion(
    SYSTEM_MESSAGE + new Date().toLocaleDateString(),
    userMessage
  );

  return JSON.parse(completion.choices[0]?.message?.content);
};

const getCompletion = async (systemMessage, userMessage) => {
  const response = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [
      {
        role: "system",
        content: systemMessage,
      },
      { role: "user", content: userMessage },
    ],
  });

  return response;
};

module.exports = {
  getCompletionForExpense,
};
