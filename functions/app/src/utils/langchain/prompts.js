const { PromptTemplate } = require("@langchain/core/prompts");
const PROMPTS = require("../prompts");

/**
 * Prompt for expense classification
 */
const EXPENSE_CLASSIFICATION_PROMPT = PromptTemplate.fromTemplate(
  PROMPTS.EXPENSE_CLASSIFICATION
);

/**
 * Prompt for function calling
 */
const FUNCTION_CALLING_PROMPT = PromptTemplate.fromTemplate(
  PROMPTS.FUNCTION_CALLING
);

/**
 * Prompt for response summarization
 */
const RESPONSE_SUMMARIZATION_PROMPT = PromptTemplate.fromTemplate(
  PROMPTS.RESPONSE_SUMMARIZATION
);

/**
 * Creates a summarization prompt with the function result
 * @param {Object} result - The result from function calling
 * @returns {PromptTemplate} The prompt template with the result
 */
function createSummarizationPrompt(result) {
  return PromptTemplate.fromTemplate(
    PROMPTS.generateSummarizationPrompt(result)
  );
}

module.exports = {
  EXPENSE_CLASSIFICATION_PROMPT,
  FUNCTION_CALLING_PROMPT,
  RESPONSE_SUMMARIZATION_PROMPT,
  createSummarizationPrompt,
};
