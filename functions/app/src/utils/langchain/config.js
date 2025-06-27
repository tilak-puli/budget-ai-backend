const API_KEY = "AIzaSyDMexkXg7tt1KaH9qdga0PvT-TTo8TlSj4"; // Using the same API key from the original implementation

/**
 * Configuration for LangChain models and tools
 */
module.exports = {
  API_KEY,
  MODEL_NAME: "gemini-2.0-flash-lite", // Using the same model as the original implementation
  TEMPERATURE: 0.2, // Lower temperature for more deterministic outputs
  MAX_TOKENS: 1024,
  TOP_P: 0.95,
  TOP_K: 40,
};
