/**
 * Test script to verify the integration with expense.js
 */
const { generateExpense } = require("../../service/expense.js");

// Test user IDs
const LANGCHAIN_USER = "8SJGODcWICSSfcIDf0FlOE7YduK2";
const REGULAR_USER = "regular-user-id";

/**
 * Run test cases for both implementations
 */
async function runTests() {
  console.log("\n===== TESTING LANGCHAIN IMPLEMENTATION =====");
  await testImplementation(LANGCHAIN_USER);

  console.log("\n===== TESTING ORIGINAL IMPLEMENTATION =====");
  await testImplementation(REGULAR_USER);
}

/**
 * Test both expense classification and question answering
 */
async function testImplementation(userId) {
  console.log(`Testing with user ID: ${userId}`);

  // Test expense classification
  console.log("\nTesting expense classification:");
  const expensePrompt = "I spent 500 rupees on dinner yesterday";
  console.log(`User prompt: "${expensePrompt}"`);

  try {
    const expenseResult = await generateExpense(userId, expensePrompt);
    console.log("Result:", JSON.stringify(expenseResult, null, 2));
  } catch (error) {
    console.error("Error:", error);
  }

  // Test question answering
  console.log("\nTesting question answering:");
  const questionPrompt = "How much did I spend on food last month?";
  console.log(`User prompt: "${questionPrompt}"`);

  try {
    const questionResult = await generateExpense(userId, questionPrompt);
    console.log("Result:", JSON.stringify(questionResult, null, 2));
  } catch (error) {
    console.error("Error:", error);
  }
}

// Run the tests if this file is executed directly
if (require.main === module) {
  runTests()
    .then(() => console.log("\nTests completed successfully"))
    .catch((error) => console.error("\nTests failed:", error))
    .finally(() => process.exit(0));
}

module.exports = {
  runTests,
};
