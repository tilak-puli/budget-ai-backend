const {
  getCompletionForExpenseWithUnifiedLangChain,
} = require("./unified-index");

/**
 * Example usage of the unified LangChain implementation
 */
async function runUnifiedExample() {
  const userId = "example-user-id";

  console.log("\n===== UNIFIED EXAMPLE 1: DIRECT EXPENSE =====");
  const expensePrompt = "Food";
  console.log("User prompt:", expensePrompt);
  const expenseResult = await getCompletionForExpenseWithUnifiedLangChain(
    expensePrompt,
    userId,
    [
      {
        role: "human",
        content: "434 cakes ",
      },
      {
        role: "ai",
        content: `I can help you track your expenses. Could you please provide more details, such as the amount and category for the cakes? For example, \"Cakes 434 Food\" or \"Spent $434 on cakes\".`,
      },
    ]
  );
  console.log("Result:", JSON.stringify(expenseResult, null, 2));

  // console.log("\n===== UNIFIED EXAMPLE 2: ASK QUESTION (TOOL CALLING) =====");
  // const askPrompt = "How much did I spend on food last month?";
  // console.log("User prompt:", askPrompt);
  // const askResult = await getCompletionForExpenseWithUnifiedLangChain(
  //   askPrompt,
  //   userId
  // );
  // console.log("Result:", JSON.stringify(askResult, null, 2));

  // console.log("\n===== UNIFIED EXAMPLE 3: COMPLEX QUERY (TOOL CALLING) =====");
  // const complexPrompt =
  //   "What were my largest expenses in the entertainment category this year?";
  // console.log("User prompt:", complexPrompt);
  // const complexResult = await getCompletionForExpenseWithUnifiedLangChain(
  //   complexPrompt,
  //   userId
  // );
  // console.log("Result:", JSON.stringify(complexResult, null, 2));
}

// Run the example if this file is executed directly
if (require.main === module) {
  runUnifiedExample()
    .then(() => console.log("\nUnified example completed successfully"))
    .catch((error) => console.error("\nUnified example failed:", error))
    .finally(() => process.exit(0));
}

module.exports = {
  runUnifiedExample,
};
