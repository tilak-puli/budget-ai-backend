const { UnifiedExpenseAgent } = require("./agent-unified");

// Create a singleton instance of the unified agent
const unifiedExpenseAgent = new UnifiedExpenseAgent();

/**
 * Unified LangChain implementation of the expense completion function
 * @param {string} prompt - The user's prompt
 * @param {string} userId - The user's ID
 * @param {Array} previousMessages - Optional array of previous messages in {role: 'human'|'ai', content: string} format
 * @returns {Object} The processed expense or ask reply
 */
const getCompletionForExpenseWithUnifiedLangChain = async (
  prompt,
  userId,
  previousMessages = []
) => {
  return await unifiedExpenseAgent.processPrompt(
    prompt,
    userId,
    previousMessages
  );
};

module.exports = {
  getCompletionForExpenseWithUnifiedLangChain,
};
