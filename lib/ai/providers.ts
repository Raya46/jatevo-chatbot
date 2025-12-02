import { google } from "@ai-sdk/google";
import { customProvider } from "ai";
import { isTestEnvironment } from "../constants";
import { jatevo } from "./providers/jatevo-provider";

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
          "image-model": google("gemini-2.5-flash-image-preview"), // Gemini Flash Image for image generation only
        },
      });
    })()
  : customProvider({
      languageModels: {
        "chat-model": jatevo("deepseek-ai/DeepSeek-R1-0528"), // Jatevo LLM for regular chat
        "chat-model-reasoning": jatevo("deepseek-ai/DeepSeek-R1-0528"), // Jatevo LLM for reasoning (without middleware)
        "title-model": jatevo("deepseek-ai/DeepSeek-R1-0528"), // Jatevo for titles
        "artifact-model": jatevo("deepseek-ai/DeepSeek-R1-0528"), // Jatevo for artifacts
        "image-model": google("gemini-2.5-flash-image-preview"), // Gemini Flash Image for image generation only
      },
    });
