const { v4 } = require("uuid");
const { createModel } = require("./modelProvider");
const { createExpenseTools } = require("./tools");
const { getNowInIndiaTimezone } = require("../date");
const {
  ChatPromptTemplate,
  SystemMessagePromptTemplate,
  HumanMessagePromptTemplate,
} = require("@langchain/core/prompts");
const { tool } = require("@langchain/core/tools");
const { z } = require("zod");
const Budget = require("../../models/budget");
const {
  UNIFIED_SYSTEM_PROMPT,
  RESPONSE_SUMMARIZATION_PROMPT,
} = require("./unified-prompts");

/**
 * Unified LangChain implementation of the expense agent using a single model call
 */
class UnifiedExpenseAgent {
  constructor() {
    this.model = createModel();
  }

  /**
   * Process a user prompt for expense-related queries with a single model call
   * @param {string} prompt - The user's prompt
   * @param {string} userId - The user's ID
   * @returns {Object} The processed expense or ask reply
   */
  async processPrompt(prompt, userId) {
    console.log("[Unified Agent] Processing prompt:", prompt);

    try {
      // Create tools including the special expense classification tool
      const tools = [
        this.createExpenseClassificationTool(),
        ...createExpenseTools(userId),
      ];

      // Create the system message with the unified prompt
      const systemPrompt = `${UNIFIED_SYSTEM_PROMPT}\n\nToday's date is ${getNowInIndiaTimezone()}.`;
      const systemMessage =
        SystemMessagePromptTemplate.fromTemplate(systemPrompt);
      const humanMessage = HumanMessagePromptTemplate.fromTemplate("{input}");
      const chatPrompt = ChatPromptTemplate.fromMessages([
        systemMessage,
        humanMessage,
      ]);

      // Bind tools to the model
      const modelWithTools = this.model.bindTools(tools);

      // Invoke the model with the prompt and tools
      const messages = await chatPrompt.formatMessages({ input: prompt });
      const response = await modelWithTools.invoke(messages);

      console.log("[Unified Agent] Model response:", response);

      // Check if a tool was called
      if (response.tool_calls && response.tool_calls.length > 0) {
        const toolCall = response.tool_calls[0];
        console.log("[Unified Agent] Tool called:", toolCall);

        // Check if it's the expense classification tool
        if (toolCall.name === "classifyExpense") {
          // Handle expense classification
          const expense = toolCall.args;
          console.log("[Unified Agent] Expense classified:", expense);

          // Format the expense
          expense.date = new Date(expense.date);
          if (isNaN(expense.date.getTime())) {
            expense.date = getNowInIndiaTimezone();
          }
          expense._id = v4();

          return { expense };
        } else {
          // Handle other tool calls
          const tool = tools.find((t) => t.name === toolCall.name);

          if (!tool) {
            throw new Error(`Unknown tool: ${toolCall.name}`);
          }

          // Execute the tool with the provided arguments
          const toolResult = await tool.invoke(toolCall.args);
          const parsedResult = JSON.parse(toolResult);

          // Format the result into a human-readable response using the simplified prompt
          const finalPrompt = `${RESPONSE_SUMMARIZATION_PROMPT}\n\nUser query: "${prompt}"\n\nFunction result: ${toolResult}`;
          const finalResponse = await this.model.invoke(finalPrompt);

          return { askReply: finalResponse.content };
        }
      } else {
        // If no tool was called, return the model's response directly
        return { askReply: response.content };
      }
    } catch (error) {
      console.error("[Unified Agent] Error processing prompt:", error);
      return { error: `Error processing request: ${error.message}` };
    }
  }

  /**
   * Create a tool for expense classification
   * @returns {Object} Expense classification tool
   */
  createExpenseClassificationTool() {
    return tool(
      ({ description, amount, category, date }) => {
        // This function doesn't actually need to do anything since we just want the model to format the expense
        return JSON.stringify({ description, amount, category, date });
      },
      {
        name: "classifyExpense",
        description:
          "Use this tool when the user is trying to record an expense. Extract and format the expense details.",
        schema: z.object({
          description: z
            .string()
            .describe(
              "Expense description. Correct spelling mistakes and make it more readable"
            ),
          amount: z.number().describe("Expense amount"),
          category: z.enum(Budget.CATEGORIES).describe("Expense category"),
          date: z
            .string()
            .describe("Expense date, if user not provided give today date"),
        }),
      }
    );
  }
}

module.exports = {
  UnifiedExpenseAgent,
};
