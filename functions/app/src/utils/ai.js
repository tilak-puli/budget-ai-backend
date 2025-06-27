const { GoogleGenAI, Type, Schema } = require("@google/genai");
const { v4 } = require("uuid");
const API_KEY = "AIzaSyDMexkXg7tt1KaH9qdga0PvT-TTo8TlSj4";
const genAI = new GoogleGenAI({
  apiKey: API_KEY,
});
const { getNowInIndiaTimezone } = require("./date.js");
const expenseQuery = require("../service/expenseQuery.js");
const Budget = require("../models/budget.js");
const PROMPTS = require("./prompts.js");
const functionDeclarations = [
  {
    name: "getTotalSpent",
    description: "Get the total amount spent in a category and/or time period.",
    parameters: {
      type: "object",
      properties: {
        category: {
          type: "string",
          description: "Expense category",
          enum: Budget.CATEGORIES,
        },
        startDate: { type: "string", description: "Start date (YYYY-MM-DD)" },
        endDate: { type: "string", description: "End date (YYYY-MM-DD)" },
      },
    },
  },
  {
    name: "getExpenses",
    description:
      "List expenses, optionally filtered by category, date, or amount.",
    parameters: {
      type: "object",
      properties: {
        category: {
          type: "string",
          description: "Expense category",
          enum: Budget.CATEGORIES,
        },
        startDate: { type: "string", description: "Start date (YYYY-MM-DD)" },
        endDate: { type: "string", description: "End date (YYYY-MM-DD)" },
        minAmount: { type: "number", description: "Minimum amount" },
        maxAmount: { type: "number", description: "Maximum amount" },
      },
    },
  },
  {
    name: "getExpenseSummary",
    description: "Get a summary of expenses by category or time period.",
    parameters: {
      type: "object",
      properties: {
        groupBy: {
          type: "string",
          description: "Group by 'category', 'month', or 'week'",
          enum: ["category", "month", "week"],
        },
        startDate: { type: "string", description: "Start date (YYYY-MM-DD)" },
        endDate: { type: "string", description: "End date (YYYY-MM-DD)" },
      },
    },
  },
  {
    name: "getLargestExpense",
    description: "Find the largest expense in a period or category.",
    parameters: {
      type: "object",
      properties: {
        category: {
          type: "string",
          description: "Expense category",
          enum: Budget.CATEGORIES,
        },
        startDate: { type: "string", description: "Start date (YYYY-MM-DD)" },
        endDate: { type: "string", description: "End date (YYYY-MM-DD)" },
      },
    },
  },
  {
    name: "getRecurringExpenses",
    description: "List recurring expenses (subscriptions, rent, etc.).",
    parameters: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "addExpense",
    description:
      "Add a new expense. Uses the same schema as the expense response type.",
    parameters: {
      type: "object",
      properties: {
        description: { type: "string", description: "Expense description" },
        amount: { type: "number", description: "Expense amount" },
        category: {
          type: "string",
          description: "Expense category",
          enum: Budget.CATEGORIES,
        },
        date: { type: "string", description: "Expense date" },
      },
      required: ["amount", "date", "category", "description"],
    },
  },
];

const getCompletionForExpense = async (prompt, userId) => {
  const schema = getSchema();
  // 1. First, try to get a direct expense or ask from the model (no function declarations)
  console.log("[Step 1] Initial user prompt:", prompt);
  let res = await genAI.models.generateContent({
    model: "gemini-2.0-flash-lite",
    contents: [
      {
        role: "user",
        parts: [{ text: prompt }],
      },
    ],
    config: {
      responseSchema: schema,
      responseMimeType: "application/json",

      systemInstruction: {
        role: "model",
        parts: [
          {
            text: PROMPTS.EXPENSE_CLASSIFICATION,
          },
        ],
      },
    },
  });
  console.log("[Step 1] Raw model response:", res.text);

  let response;
  try {
    response = JSON.parse(res.text || "{}");
  } catch (e) {
    console.log("[Step 1] Error parsing model response:", e);
    response = {};
  }
  console.log("[Step 1] Parsed response object:", response);
  console.log(
    "[Step 1] Keys present: expense:",
    !!response.expense,
    ", isAsk:",
    !!response.isAsk,
    ", ask:",
    !!response.ask,
    ", error:",
    !!response.error
  );

  // If it's a direct expense, return it
  if (!response.isAsk && response.expense && response.expense.amount) {
    console.log("[Step 1] Direct expense detected:", response.expense);
    response.expense.date = new Date(response.expense.date);
    if (isNaN(response.expense.date.getTime())) {
      response.expense.date = getNowInIndiaTimezone();
    }
    response.expense._id = v4();
    console.log("[Step 1] Returning expense:", response.expense);
    return { expense: response.expense };
  }

  // If it's an ask, proceed to function calling
  if (response.isAsk) {
    // 2. Call model again with function declarations and mode ANY
    const askPrompt = response.ask?.message || prompt;
    console.log(
      "[Step 2] Ask detected. Prompt for function calling:",
      askPrompt
    );
    const res2 = await genAI.models.generateContent({
      model: "gemini-2.0-flash-lite",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `${askPrompt}. today's date is ${getNowInIndiaTimezone()}`,
            },
          ],
        },
      ],
      config: {
        tools: [{ functionDeclarations }],
        toolConfig: {
          functionCallingConfig: {
            mode: "ANY",
            allowedFunctionNames: functionDeclarations.map((f) => f.name),
          },
        },
        systemInstruction: {
          role: "system",
          parts: [
            {
              text: PROMPTS.FUNCTION_CALLING,
            },
          ],
        },
      },
    });
    console.log(
      "[Step 2] Model function call response:",
      JSON.stringify(res2.functionCalls)
    );

    if (res2.functionCalls && res2.functionCalls.length > 0) {
      const call = res2.functionCalls[0];
      const fn = expenseQuery[call.name];
      console.log(
        "[Step 2] Function to call:",
        call.name,
        "with args:",
        call.args
      );
      if (!fn) {
        console.log("[Step 2] Unknown function:", call.name);
        return { error: `Unknown function: ${call.name}` };
      }
      try {
        const result = await fn(userId, call.args || {});
        console.log("[Step 2] Function result:", result);
        // 3. Call model again, passing the function result for summarization (no function declarations)
        console.log(
          "[Step 3] Passing function result to model for summarization:",
          result
        );
        const res3 = await genAI.models.generateContent({
          model: "gemini-2.0-flash-lite",
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: PROMPTS.generateSummarizationPrompt(result),
                },
              ],
            },
          ],
          config: {
            systemInstruction: {
              role: "system",
              parts: [
                {
                  text: PROMPTS.RESPONSE_SUMMARIZATION,
                },
              ],
            },
          },
        });
        console.log("[Step 3] Model summary response:", res3.text);
        return { askReply: res3.text };
      } catch (err) {
        console.log("[Step 2] Function call failed:", err.message);
        return { error: `Function call failed: ${err.message}` };
      }
    } else {
      console.log("[Step 2] No function call found for ask.");
      return { error: "No function call found for ask." };
    }
  }

  // Fallback: return error or unknown
  console.log(
    "[Fallback] Could not process request. Full response:",
    response,
    "Error field:",
    response.error?.message
  );
  return { error: response.error?.message || "Could not process request." };
};

module.exports = {
  getCompletionForExpense,
};

function getSchema() {
  const expenseSchema = {
    description: "Expense details",
    type: Type.OBJECT,
    properties: {
      description: {
        type: Type.STRING,
        description:
          "Expense description. Correct spelling mistakes and make it more readable",
      },
      amount: {
        type: Type.NUMBER,
        description: "Expense amount",
      },
      category: {
        type: Type.STRING,
        description: "Expense category",
        enum: [
          "Food",
          "Transport",
          "Rent",
          "Entertainment",
          "Utilities",
          "Groceries",
          "Shopping",
          "Healthcare",
          "Personal Care",
          "Misc",
          "Savings",
          "Insurance",
          "Lent",
        ],
      },
      date: {
        type: Type.STRING,
        description:
          "Expense date, if user not provided give today date which is " +
          getNowInIndiaTimezone(),
      },
    },
    required: ["amount", "date", "category", "description"],
  };

  const errorSchema = {
    description: "Error message",
    type: Type.OBJECT,
    properties: {
      message: {
        type: Type.STRING,
        description: "Error message",
      },
    },
  };
  return {
    description: "Expense or error",
    type: Type.OBJECT,
    properties: {
      expense: expenseSchema,
      error: errorSchema,
      isAsk: {
        type: Type.BOOLEAN,
        description: "Whether the user asked a question",
      },
      ask: {
        type: Type.STRING,
        description: "User question",
      },
    },
    required: ["isAsk", "ask"],
  };
}
