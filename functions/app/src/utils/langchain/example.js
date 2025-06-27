const { getCompletionForExpenseWithLangChain } = require("./index");

/**
 * Example usage of the LangChain implementation with modern tool calling
 */
async function runExample() {
  const userId = "example-user-id";

  console.log("\n===== EXAMPLE 1: DIRECT EXPENSE =====");
  const expensePrompt = "I spent 500 rupees on dinner yesterday";
  console.log("User prompt:", expensePrompt);
  const expenseResult = await getCompletionForExpenseWithLangChain(
    expensePrompt,
    userId
  );
  console.log("Result:", JSON.stringify(expenseResult, null, 2));

  console.log("\n===== EXAMPLE 2: ASK QUESTION (TOOL CALLING) =====");
  const askPrompt = "How much did I spend on food last month?";
  console.log("User prompt:", askPrompt);
  const askResult = await getCompletionForExpenseWithLangChain(
    askPrompt,
    userId
  );
  console.log("Result:", JSON.stringify(askResult, null, 2));

  console.log("\n===== EXAMPLE 3: COMPLEX QUERY (TOOL CALLING) =====");
  const complexPrompt =
    "What were my largest expenses in the entertainment category this year?";
  console.log("User prompt:", complexPrompt);
  const complexResult = await getCompletionForExpenseWithLangChain(
    complexPrompt,
    userId
  );
  console.log("Result:", JSON.stringify(complexResult, null, 2));
}

// Run the example if this file is executed directly
if (require.main === module) {
  runExample()
    .then(() => console.log("\nExample completed successfully"))
    .catch((error) => console.error("\nExample failed:", error))
    .finally(() => process.exit(0));
}

module.exports = {
  runExample,
};
