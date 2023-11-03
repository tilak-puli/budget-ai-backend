const OpenAI = require("openai");
const API_KEY = "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"
const openai = new OpenAI({ apiKey: API_KEY });

const SYSTEM_MESSAGE = "As a expense tracker. Respond in json format of the expense with category, amount, description."

const getCompletionForExpense = async (userMessage) => {
    const completion =  await getCompletion(SYSTEM_MESSAGE, userMessage);

    return JSON.parse(completion.choices[0]?.message?.content);
  }
  
const getCompletion = async (systemMessage, userMessage) => {
  console.log("getting completion for " + userMessage)
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{
        "role": "system",
        "content": systemMessage
      },  
        {"role": "user", "content": userMessage}]
    });
    
    return response;
  }

module.exports = {
    getCompletionForExpense
}