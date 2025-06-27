const { ChatGoogleGenerativeAI } = require("@langchain/google-genai");
const config = require("./config");

/**
 * Creates and configures a Google Generative AI model instance using LangChain
 * @returns {ChatGoogleGenerativeAI} Configured model instance
 */
function createModel() {
  return new ChatGoogleGenerativeAI({
    apiKey: config.API_KEY,
    model: config.MODEL_NAME,
    maxOutputTokens: config.MAX_TOKENS,
    temperature: config.TEMPERATURE,
    topP: config.TOP_P,
    topK: config.TOP_K,
  });
}

module.exports = {
  createModel,
};
