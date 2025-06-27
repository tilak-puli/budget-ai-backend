const { v4 } = require("uuid");
const { createModel } = require("./modelProvider");
const { createExpenseTools } = require("./tools");
const { responseSchema, expenseSchema } = require("./schemas");
const {
  EXPENSE_CLASSIFICATION_PROMPT,
  FUNCTION_CALLING_PROMPT,
  RESPONSE_SUMMARIZATION_PROMPT,
  createSummarizationPrompt,
} = require("./prompts");
const { getNowInIndiaTimezone } = require("../date");
const { StructuredOutputParser } = require("langchain/output_parsers");
const {
  AgentExecutor,
  createOpenAIFunctionsAgent,
} = require("langchain/agents");
const {
  ChatPromptTemplate,
  SystemMessagePromptTemplate,
  HumanMessagePromptTemplate,
} = require("@langchain/core/prompts");
const {
  convertToOpenAIFunction,
} = require("@langchain/core/utils/function_calling");

/**
 * Modern LangChain implementation of the expense agent using direct tool calling
 */
class ExpenseAgent {
  constructor() {
    this.model = createModel();
    this.expenseParser = StructuredOutputParser.fromZodSchema(expenseSchema);
  }

  /**
   * Process a user prompt for expense-related queries
   * @param {string} prompt - The user's prompt
   * @param {string} userId - The user's ID
   * @returns {Object} The processed expense or ask reply
   */
  async processPrompt(prompt, userId) {
    console.log("[LangChain Agent] Processing prompt:", prompt);

    try {
      // First try to parse as a direct expense entry
      const expenseResult = await this.tryParseAsExpense(prompt);

      // If it's a valid expense, return it
      if (expenseResult && expenseResult.amount) {
        console.log(
          "[LangChain Agent] Direct expense detected:",
          expenseResult
        );
        expenseResult.date = new Date(expenseResult.date);
        if (isNaN(expenseResult.date.getTime())) {
          expenseResult.date = getNowInIndiaTimezone();
        }
        expenseResult._id = v4();
        return { expense: expenseResult };
      }

      // If not a direct expense, process as a query using modern tool calling
      console.log(
        "[LangChain Agent] Not a direct expense, processing as query with tools"
      );
      const toolResult = await this.processWithTools(prompt, userId);
      console.log("[LangChain Agent] Tool result:", toolResult);

      return { askReply: toolResult };
    } catch (error) {
      console.error("[LangChain Agent] Error processing prompt:", error);
      return { error: `Error processing request: ${error.message}` };
    }
  }

  /**
   * Try to parse the prompt as a direct expense entry
   * @param {string} prompt - The user's prompt
   * @returns {Object|null} Expense object or null if not an expense
   */
  async tryParseAsExpense(prompt) {
    const systemMessage = SystemMessagePromptTemplate.fromTemplate(
      EXPENSE_CLASSIFICATION_PROMPT
    );
    const humanMessage = HumanMessagePromptTemplate.fromTemplate("{input}");

    const chatPrompt = ChatPromptTemplate.fromMessages([
      systemMessage,
      humanMessage,
    ]);

    try {
      // Use structured output directly for expense parsing
      const result = await this.model.invoke(
        await chatPrompt.formatMessages({ input: prompt }),
        {
          response_format: { type: "json_object" },
        }
      );

      let parsedContent;
      try {
        parsedContent = JSON.parse(result.content);
      } catch (e) {
        console.log("[LangChain Agent] Error parsing model response:", e);
        return null;
      }

      // Check if it's an expense or a question
      if (!parsedContent.isAsk && parsedContent.expense) {
        return parsedContent.expense;
      }

      return null;
    } catch (error) {
      console.error("[LangChain Agent] Error parsing as expense:", error);
      return null;
    }
  }

  /**
   * Process the prompt with tools using modern tool calling
   * @param {string} prompt - The user's prompt
   * @param {string} userId - The user's ID
   * @returns {string} The result of the tool execution
   */
  async processWithTools(prompt, userId) {
    // Create tools
    const tools = createExpenseTools(userId);

    // Create the system message with today's date
    const systemMessage = SystemMessagePromptTemplate.fromTemplate(
      `${FUNCTION_CALLING_PROMPT} Today's date is ${getNowInIndiaTimezone()}.`
    );
    const humanMessage = HumanMessagePromptTemplate.fromTemplate("{input}");
    const chatPrompt = ChatPromptTemplate.fromMessages([
      systemMessage,
      humanMessage,
    ]);

    // Bind tools to the model
    const modelWithTools = this.model.bindTools(tools);

    try {
      // Invoke the model with the prompt and tools
      const messages = await chatPrompt.formatMessages({ input: prompt });
      const response = await modelWithTools.invoke(messages);

      // Check if a tool was called
      if (response.tool_calls && response.tool_calls.length > 0) {
        console.log("[LangChain Agent] Tool called:", response.tool_calls);

        // Get the first tool call
        const toolCall = response.tool_calls[0];
        const tool = tools.find((t) => t.name === toolCall.name);

        if (!tool) {
          throw new Error(`Unknown tool: ${toolCall.name}`);
        }

        // Execute the tool with the provided arguments
        const toolResult = await tool.invoke(toolCall.args);
        const parsedResult = JSON.parse(toolResult);

        // Format the result into a human-readable response
        const finalResponse = await this.model.invoke([
          ...messages,
          response,
          {
            role: "function",
            name: toolCall.name,
            content: toolResult,
          },
        ]);

        return finalResponse.content;
      } else {
        // If no tool was called, return the model's response directly
        return response.content;
      }
    } catch (error) {
      console.error("[LangChain Agent] Error processing with tools:", error);
      throw error;
    }
  }
}

module.exports = {
  ExpenseAgent,
};
