import { google } from "@ai-sdk/google";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { customProvider } from "ai";
import { isTestEnvironment } from "../constants";
import { jatevo } from "./providers/jatevo-provider";

// Create OpenRouter provider instance for Perplexity and other models
export const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY || "",
});

export const myProvider = isTestEnvironment
  ? (() => {
      const {
        artifactModel,
        chatModel,
        reasoningModel,
        titleModel,
      } = require("./models.mock");
      return customProvider({
        languageModels: {
          "chat-model": chatModel,
          "chat-model-reasoning": reasoningModel,
          "title-model": titleModel,
          "artifact-model": artifactModel,
          "image-model": google("gemini-2.5-flash-image-preview"),
          "tool-model": google("gemini-2.5-flash"),
        },
      });
    })()
  : customProvider({
      languageModels: {
        "chat-model": jatevo("gpt-oss-120b"),
        "chat-model-reasoning": jatevo("gpt-oss-120b"),
        "title-model": jatevo("gpt-oss-120b"),
        "artifact-model": jatevo("gpt-oss-120b"),
        "image-model": google("gemini-2.5-flash-image-preview"),
        "tool-model": google("gemini-2.5-flash"),
      },
    });
