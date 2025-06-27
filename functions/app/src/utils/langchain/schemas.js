const { z } = require("zod");
const Budget = require("../../models/budget");
const { getNowInIndiaTimezone } = require("../date");

// Define the expense schema
const expenseSchema = z.object({
  description: z
    .string()
    .describe(
      "Expense description. Correct spelling mistakes and make it more readable"
    ),
  amount: z.number().describe("Expense amount"),
  category: z.enum(Budget.CATEGORIES).describe("Expense category"),
  date: z
    .string()
    .describe(
      `Expense date, if user not provided give today date which is ${getNowInIndiaTimezone()}`
    ),
});

// Define the error schema
const errorSchema = z.object({
  message: z.string().describe("Error message"),
});

// Define the combined response schema
const responseSchema = z.object({
  expense: expenseSchema.optional(),
  error: errorSchema.optional(),
  isAsk: z.boolean().describe("Whether the user asked a question"),
  ask: z.string().optional().describe("User question"),
});

module.exports = {
  expenseSchema,
  errorSchema,
  responseSchema,
};
