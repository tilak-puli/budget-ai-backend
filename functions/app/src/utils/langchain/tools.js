const { tool } = require("@langchain/core/tools");
const { z } = require("zod");
const Budget = require("../../models/budget");
const expenseQuery = require("../../service/expenseQuery");

/**
 * Creates LangChain tools from the expense query functions using the modern approach
 * @param {string} userId - User ID for the expense queries
 * @returns {Array} Array of LangChain tools
 */
function createExpenseTools(userId) {
  // Tool for getting total spent
  const getTotalSpentTool = tool(
    async ({ category, startDate, endDate }) => {
      const result = await expenseQuery.getTotalSpent(userId, {
        category,
        startDate,
        endDate,
      });
      return JSON.stringify(result);
    },
    {
      name: "getTotalSpent",
      description:
        "Get the total amount spent in a category and/or time period.",
      schema: z.object({
        category: z
          .enum(Budget.CATEGORIES)
          .optional()
          .describe("Expense category"),
        startDate: z.string().optional().describe("Start date (YYYY-MM-DD)"),
        endDate: z.string().optional().describe("End date (YYYY-MM-DD)"),
      }),
    }
  );

  // Tool for getting expenses
  const getExpensesTool = tool(
    async ({ category, startDate, endDate, minAmount, maxAmount }) => {
      const result = await expenseQuery.getExpenses(userId, {
        category,
        startDate,
        endDate,
        minAmount,
        maxAmount,
      });
      return JSON.stringify(result);
    },
    {
      name: "getExpenses",
      description:
        "List expenses, optionally filtered by category, date, or amount.",
      schema: z.object({
        category: z
          .enum(Budget.CATEGORIES)
          .optional()
          .describe("Expense category"),
        startDate: z.string().optional().describe("Start date (YYYY-MM-DD)"),
        endDate: z.string().optional().describe("End date (YYYY-MM-DD)"),
        minAmount: z.number().optional().describe("Minimum amount"),
        maxAmount: z.number().optional().describe("Maximum amount"),
      }),
    }
  );

  // Tool for getting expense summary
  const getExpenseSummaryTool = tool(
    async ({ groupBy, startDate, endDate }) => {
      const result = await expenseQuery.getExpenseSummary(userId, {
        groupBy,
        startDate,
        endDate,
      });
      return JSON.stringify(result);
    },
    {
      name: "getExpenseSummary",
      description: "Get a summary of expenses by category or time period.",
      schema: z.object({
        groupBy: z
          .enum(["category", "month", "week"])
          .describe("Group by 'category', 'month', or 'week'"),
        startDate: z.string().optional().describe("Start date (YYYY-MM-DD)"),
        endDate: z.string().optional().describe("End date (YYYY-MM-DD)"),
      }),
    }
  );

  // Tool for getting largest expense
  const getLargestExpenseTool = tool(
    async ({ category, startDate, endDate }) => {
      const result = await expenseQuery.getLargestExpense(userId, {
        category,
        startDate,
        endDate,
      });
      return JSON.stringify(result);
    },
    {
      name: "getLargestExpense",
      description: "Find the largest expense in a period or category.",
      schema: z.object({
        category: z
          .enum(Budget.CATEGORIES)
          .optional()
          .describe("Expense category"),
        startDate: z.string().optional().describe("Start date (YYYY-MM-DD)"),
        endDate: z.string().optional().describe("End date (YYYY-MM-DD)"),
      }),
    }
  );

  // Tool for getting recurring expenses
  const getRecurringExpensesTool = tool(
    async () => {
      const result = await expenseQuery.getRecurringExpenses(userId, {});
      return JSON.stringify(result);
    },
    {
      name: "getRecurringExpenses",
      description: "List recurring expenses (subscriptions, rent, etc.).",
      schema: z.object({}),
    }
  );

  // Tool for adding an expense
  const addExpenseTool = tool(
    async ({ description, amount, category, date }) => {
      const result = await expenseQuery.addExpense(userId, {
        description,
        amount,
        category,
        date,
      });
      return JSON.stringify(result);
    },
    {
      name: "addExpense",
      description:
        "Add a new expense. Uses the same schema as the expense response type.",
      schema: z.object({
        description: z.string().describe("Expense description"),
        amount: z.number().describe("Expense amount"),
        category: z.enum(Budget.CATEGORIES).describe("Expense category"),
        date: z.string().describe("Expense date"),
      }),
    }
  );

  return [
    getTotalSpentTool,
    getExpensesTool,
    getExpenseSummaryTool,
    getLargestExpenseTool,
    getRecurringExpensesTool,
    addExpenseTool,
  ];
}

module.exports = {
  createExpenseTools,
};
