import { google } from "@ai-sdk/google";
import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from "ai";
import { isTestEnvironment } from "../constants";

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
        },
      });
    })()
  : customProvider({
      languageModels: {
        "chat-model": google("gemini-2.5-flash"), // Fast and cost-effective
        "chat-model-reasoning": wrapLanguageModel({
          model: google("gemini-2.5-flash"), // Use Gemini 2.5 Flash with reasoning
          middleware: extractReasoningMiddleware({ tagName: "think" }),
        }),
        "title-model": google("gemini-2.5-flash"),
        "artifact-model": google("gemini-2.5-flash"),
      },
    });
