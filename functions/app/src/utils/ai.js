const { GoogleGenAI, Type, Schema } = require("@google/genai");
const { v4 } = require("uuid");
const API_KEY = "AIzaSyA2n-NG0mBfxVfnox6Dpb3jjQgEqZZVHSk";
const genAI = new GoogleGenAI({
  apiKey: API_KEY,
});
const { getNowInIndiaTimezone } = require("./date");

const getCompletionForExpense = async (prompt) => {
  console.log("Getting completion for expense");
  const schema = getSchema();
  const res = await genAI.models.generateContent({
    model: "gemini-2.0-flash-lite",
    config: {
      responseMimeType: "application/json",
      responseSchema: schema,
    },
    contents: [
      {
        role: "model",
        parts: [
          {
            text: "You are a Financial Assistant that can help me with my expenses. You should respond with either error schema or expense schema. Error schema if user asks something else or it is not related to expense. expense schema if user proovided expense name and amount. other params like category and data can be empty.",
          },
        ],
      },
      {
        role: "user",
        parts: [
          {
            text: prompt,
          },
        ],
      },
    ],
  });

  let response;

  try {
    response = JSON.parse(res.text || "{}");
  } catch (e) {
    console.error(e);
    response = "Failed to parse response";
  }
  response.expense.date = new Date(response.expense.date);

  if (isNaN(response.expense.date.getTime())) {
    response.expense.date = getNowInIndiaTimezone();
  }

  response.expense._id = v4();
  return response;
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
    },
    required: ["expense", "error"],
  };
}