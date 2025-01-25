const { GoogleGenerativeAI, SchemaType } = require("@google/generative-ai");

const API_KEY = "AIzaSyA2n-NG0mBfxVfnox6Dpb3jjQgEqZZVHSk";
const genAI = new GoogleGenerativeAI(API_KEY);

const schema = {
  description: "Expense details",
  type: SchemaType.OBJECT,
  properties: {
    properties: {
      description: {
        type: SchemaType.STRING,
        description: "Expense description",
        default: "Random",
      },
      amount: {
        type: SchemaType.NUMBER,
        description: "Expense amount",
        default: 0,
      },
      category: {
        type: SchemaType.STRING,
        description: "Expense category",
        default: "Other",
      },
      date: {
        type: SchemaType.DATE,
        description: "Expense date",
      },
      _id: {
        type: SchemaType.STRING,
        description: "Unique identifier for the expense",
      },
    },
    required: ["amount", "date", "_id", "category", "description"],
  },
};

const model = genAI.getGenerativeModel({
  model: "gemini-1.5-pro",
  generationConfig: {
    responseMimeType: "application/json",
    responseSchema: schema,
  },
});

const getCompletionForExpense = async (prompt) => {
  return await model.generateContent(prompt);
};

module.exports = {
  getCompletionForExpense,
};
