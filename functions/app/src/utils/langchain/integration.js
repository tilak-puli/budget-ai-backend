/**
 * This file demonstrates how to integrate the LangChain implementation
 * with the existing code. It shows how to replace the direct Google GenAI
 * API calls with the LangChain implementation.
 */

const { getCompletionForExpenseWithLangChain } = require("./index");
const { getCompletionForExpense } = require("../ai");

/**
 * Example of how to integrate the LangChain implementation
 * with the existing expenseController.js
 */
async function processExpenseWithLangChain(req, res) {
  try {
    const { prompt } = req.body;
    const userId = req.user.uid;

    // Use LangChain implementation instead of direct API calls
    const result = await getCompletionForExpenseWithLangChain(prompt, userId);

    if (result.expense) {
      // Handle expense
      return res.status(200).json({
        success: true,
        data: result.expense,
      });
    } else if (result.askReply) {
      // Handle ask reply
      return res.status(200).json({
        success: true,
        data: {
          reply: result.askReply,
        },
      });
    } else {
      // Handle error
      return res.status(400).json({
        success: false,
        error: result.error || "Unknown error",
      });
    }
  } catch (error) {
    console.error("Error processing expense with LangChain:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

/**
 * Feature flag function to choose between original implementation
 * and LangChain implementation
 */
async function processExpenseWithFeatureFlag(req, res) {
  const useLangChain = process.env.USE_LANGCHAIN === "true";

  if (useLangChain) {
    console.log("Using LangChain implementation");
    return processExpenseWithLangChain(req, res);
  } else {
    console.log("Using original implementation");
    // Call the original implementation
    // This is just a sketch - the actual implementation would depend on how
    // the original code is structured
    try {
      const { prompt } = req.body;
      const userId = req.user.uid;

      const result = await getCompletionForExpense(prompt, userId);

      // Handle the result based on the original implementation
      // ...

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error(
        "Error processing expense with original implementation:",
        error
      );
      return res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
}

module.exports = {
  processExpenseWithLangChain,
  processExpenseWithFeatureFlag,
};
