# LangChain Implementation for Budget AI

This directory contains a LangChain-based implementation of the Budget AI agent logic, replacing the direct Google GenAI API calls with a more structured approach using LangChain.js.

## Files

- `config.js` - Configuration for the LangChain models and tools
- `modelProvider.js` - Creates and configures the Google Generative AI model instance
- `schemas.js` - Defines Zod schemas for structured output parsing
- `tools.js` - Creates LangChain tools from the expense query functions using the modern tool approach
- `prompts.js` - Defines prompt templates for the LangChain chains
- `agent.js` - Implements the main LangChain agent logic with modern tool calling
- `index.js` - Exports the main function for using the LangChain implementation
- `example.js` - Example usage of the LangChain implementation
- `integration.js` - Shows how to integrate the LangChain implementation with existing code

## Usage

To use the LangChain implementation instead of the direct Google GenAI API calls:

```javascript
const { getCompletionForExpenseWithLangChain } = require("./utils/langchain");

// Replace existing call
// const result = await getCompletionForExpense(prompt, userId);

// With LangChain implementation
const result = await getCompletionForExpenseWithLangChain(prompt, userId);
```

## Running the Example

To run the example:

```bash
node src/utils/langchain/example.js
```

## Benefits of LangChain Implementation

1. **Modern Tool Calling** - Uses LangChain's modern tool calling approach for more reliable function execution
2. **Structured Code** - More modular and maintainable code structure
3. **Better Error Handling** - More robust error handling throughout the chain
4. **Extensibility** - Easier to extend with new functionality
5. **Simplified Flow** - Direct tool binding to the model without complex agent executors

## Architecture

The LangChain implementation follows a two-stage approach:

1. **Classification Stage** - Determines if the user input is a direct expense or a question
2. **Tool Execution Stage** - If it's a question, uses LangChain's modern tool calling to execute the appropriate function

### Modern Tool Calling

This implementation uses LangChain's modern tool calling approach:

1. **Tool Creation** - Uses the `tool()` function to create tools with schemas
2. **Tool Binding** - Binds tools to the model using `model.bindTools()`
3. **Tool Calling** - The model decides when to call tools based on the input
4. **Tool Execution** - Tools are executed with the arguments provided by the model

This approach is more streamlined and leverages the model's native tool calling capabilities better than the older agent executor approach.
