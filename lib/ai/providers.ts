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
        "zai-glm-4.6": jatevo("zai-org/GLM-4.6"),
        "z-ai-glm-4.5": jatevo("z-ai/GLM-4.5"),
        "deepseek-r1": jatevo("deepseek-ai/DeepSeek-R1-0528"),
        "deepseek-v3": jatevo("deepseek-ai/DeepSeek-V3-0324"),
      },
    });
