import { openai } from "@ai-sdk/openai";
import { Redis } from "@upstash/redis";
import { experimental_generateImage as generateImage, tool } from "ai";
import { z } from "zod";
import { r2Upload } from "@/lib/r2-upload";
import { generateUUID } from "@/lib/utils";

// Redis setup for caching
const redisUrl = process.env.REDIS_URL;
let redis: Redis | null = null;

if (redisUrl) {
  try {
    // Parse Redis URL correctly for Upstash format
    let token = "";
    if (redisUrl.includes("@")) {
      const authPart = redisUrl.split("@")[0];
      token = authPart
        .replace("https://", "")
        .replace("rediss://", "")
        .replace("http://", "");
    }

    redis = new Redis({
      url: redisUrl,
      token,
    });
  } catch {
    redis = null;
  }
}

const CACHE_TTL = 10 * 60; // 10 minutes

async function setCache(key: string, value: string): Promise<void> {
  if (redis) {
    try {
      await redis.setex(key, CACHE_TTL, value);
    } catch {
      // Redis failed, continue without cache
    }
  }
}

async function getCache(key: string): Promise<string | null> {
  if (redis) {
    try {
      return await redis.get<string>(key);
    } catch {
      return null;
    }
  }
  return null;
}

export const generateImageTool = () =>
  tool({
    description: "Generate an image",
    inputSchema: z.object({
      prompt: z.string().describe("The prompt to generate an image for"),
    }),
    execute: async ({ prompt }) => {
      try {
        const maxPromptLength = 1000;
        const truncatedPrompt =
          prompt.length > maxPromptLength
            ? `${prompt.substring(0, maxPromptLength)}...`
            : prompt;

        // Generate cache key based on prompt
        const cacheKey = `generated-image:${Buffer.from(truncatedPrompt).toString("base64").substring(0, 32)}`;

        // Check cache first
        const cachedUrl = await getCache(cacheKey);
        if (cachedUrl) {
          return { imageUrl: cachedUrl, success: true, cached: true };
        }

        const { image } = await generateImage({
          model: openai.imageModel("dall-e-3"),
          prompt: truncatedPrompt,
          size: "1024x1024",
          providerOptions: {
            openai: { style: "vivid", quality: "hd" },
          },
        });

        // Convert base64 to buffer for upload
        const imageBuffer = Buffer.from(image.base64, "base64");

        // Create file object for upload
        const file = new File([imageBuffer], "generated-image.png", {
          type: "image/png",
        });

        // Upload to R2
        const uploadResult = await r2Upload.uploadImage(file, {
          fileName: `ai-generated/${generateUUID()}.png`,
          bucketType: "jatevo-web",
        });

        // Cache the URL
        await setCache(cacheKey, uploadResult.url);

        return { imageUrl: uploadResult.url, success: true, cached: false };
      } catch {
        throw new Error("Failed to generate image");
      }
    },
    toModelOutput: () => {
      return {
        type: "content",
        value: [
          {
            type: "text",
            text: "Image generated successfully",
          },
        ],
      };
    },
  });
