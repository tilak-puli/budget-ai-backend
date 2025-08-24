const API_KEY = process.env.GOOGLE_AI_API_KEY || ""; // Load from environment variable

/**
 * Configuration for LangChain models and tools
 */
module.exports = {
  API_KEY,
  MODEL_NAME: "gemini-2.0-flash-lite", // Using the same model as the original implementation
  TEMPERATURE: 0, // Low temperature for more deterministic outputs
  MAX_TOKENS: 1024,
  TOP_P: 0.95, // Consider tokens in the top 95% probability mass
  TOP_K: 40, // Consider only the top 40 most likely tokens
  verbose: true,
};
