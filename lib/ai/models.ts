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
];
