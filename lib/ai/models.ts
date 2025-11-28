export const DEFAULT_CHAT_MODEL: string = "chat-model";

export type ChatModel = {
  id: string;
  name: string;
  description: string;
};

export const chatModels: ChatModel[] = [
  {
    id: "chat-model",
    name: "Gemini 2.5 Flash",
    description: "Fast and efficient model for general chat (cost-effective)",
  },
  {
    id: "chat-model-reasoning",
    name: "Gemini 2.5 Flash Reasoning",
    description:
      "Efficient reasoning model with step-by-step thinking (optimized for complex tasks)",
  },
];
