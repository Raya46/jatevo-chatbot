export const DEFAULT_CHAT_MODEL: string = "chat-model";

export type ChatModel = {
  id: string;
  name: string;
  description: string;
};

export const chatModels: ChatModel[] = [
  {
    id: "chat-model",
    name: "GPT OSS 120B",
    description:
      "Primary model for general conversation with advanced reasoning capabilities. No tool calling support.",
  },
  {
    id: "tool-model",
    name: "Gemini 2.5 Flash",
    description:
      "THE ONLY model with tool calling support! Can generate images, check weather, create documents, and more. Choose this for tools.",
  },
  {
    id: "zai-glm-4.6",
    name: "ZAI GLM-4.6",
    description:
      "Advanced reasoning model with enhanced capabilities for complex problem-solving. No tool calling support.",
  },
  {
    id: "z-ai-glm-4.5",
    name: "Z-AI GLM-4.5",
    description:
      "Balanced model for general chat and reasoning tasks with optimal performance. No tool calling support.",
  },
  {
    id: "deepseek-r1",
    name: "DeepSeek R1",
    description:
      "High-performance reasoning model for complex problem-solving and analytical tasks. No tool calling support.",
  },
  {
    id: "deepseek-v3",
    name: "DeepSeek V3",
    description:
      "Versatile model with strong reasoning and language capabilities for various use cases. No tool calling support.",
  },
];
