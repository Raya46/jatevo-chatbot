export const DEFAULT_CHAT_MODEL: string = "chat-model";

export type ChatModel = {
  id: string;
  name: string;
  description: string;
};

export const chatModels: ChatModel[] = [
  {
    id: "chat-model",
    name: "GPT-4o Mini",
    description:
      "Fast and efficient model for general chat (higher rate limits)",
  },
  {
    id: "chat-model-reasoning",
    name: "GPT-4o Mini Reasoning",
    description:
      "Efficient reasoning model with step-by-step thinking (optimized for rate limits)",
  },
];
