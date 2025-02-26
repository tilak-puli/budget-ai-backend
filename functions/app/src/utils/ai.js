const { GoogleGenerativeAI, SchemaType } = require("@google/generative-ai");
const { v4 } = require("uuid");
const API_KEY = "AIzaSyA2n-NG0mBfxVfnox6Dpb3jjQgEqZZVHSk";
const genAI = new GoogleGenerativeAI(API_KEY);
const { getNowInIndiaTimezone } = require("../utils/date");

const getCompletionForExpense = async (prompt) => {
  const schema = getSchema();
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: schema,
    },
  });

  const res = await model.generateContent(prompt);

  const expense = JSON.parse(res.response.text());

  expense.date = new Date(expense.date);

  if (isNaN(expense.date.getTime())) {
    expense.date = getNowInIndiaTimezone();
  }

  return {
    ...expense,
    _id: v4(),
  };
};

module.exports = {
  getCompletionForExpense,
};

function getSchema() {
  return {
    description: "Expense details",
    type: SchemaType.OBJECT,
    properties: {
      description: {
        type: SchemaType.STRING,
        description:
          "Expense description. Correct spelling mistakes and make it more readable",
      },
      amount: {
        type: SchemaType.NUMBER,
        description: "Expense amount",
      },
      category: {
        type: SchemaType.STRING,
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
        type: SchemaType.STRING,
        description:
          "Expense date, if user not provided give today date which is " +
          getNowInIndiaTimezone(),
      },
    },
    required: ["amount", "date", "category", "description"],
  };
}
