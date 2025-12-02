import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

// Create Jatevo provider using OpenAI-compatible interface
export const jatevo = createOpenAICompatible({
  name: "jatevo",
  apiKey: process.env.JATEVO_API_KEY || "",
  baseURL: "https://inference.jatevo.id/v1",
  headers: {
    "Content-Type": "application/json",
  },
  includeUsage: true,
});

// Export default model
export const jatevoModel = jatevo("deepseek-ai/DeepSeek-R1-0528");
