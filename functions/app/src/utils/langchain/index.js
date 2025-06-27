const { ExpenseAgent } = require("./agent");

// Create a singleton instance of the agent
const expenseAgent = new ExpenseAgent();

/**
 * LangChain implementation of the expense completion function
 * @param {string} prompt - The user's prompt
 * @param {string} userId - The user's ID
 * @returns {Object} The processed expense or ask reply
 */
const getCompletionForExpenseWithLangChain = async (prompt, userId) => {
  return await expenseAgent.processPrompt(prompt, userId);
};

module.exports = {
  getCompletionForExpenseWithLangChain,
};
