export const DEFAULT_CHAT_MODEL: string = "chat-model";

export type ChatModel = {
  id: string;
  name: string;
  description: string;
};

export const chatModels: ChatModel[] = [
  {
    id: "chat-model",
    name: "Jatevo DeepSeek-R1",
    description: "Advanced reasoning model for general chat and complex tasks",
  },
  {
    id: "chat-model-reasoning",
    name: "Jatevo DeepSeek-R1 Reasoning",
    description:
      "Enhanced reasoning model with step-by-step thinking for complex problem-solving",
  },
];
