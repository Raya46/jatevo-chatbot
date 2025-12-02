import { google } from "@ai-sdk/google";
import { Redis } from "@upstash/redis";
import { generateText, tool } from "ai";
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

        const result = await generateText({
          model: google("gemini-2.5-flash-image-preview"),
          prompt: truncatedPrompt,
          providerOptions: {
            google: {
              imageConfig: {
                aspectRatio: "1:1",
              },
            },
          },
        });

        // Find the generated image in the result files
        let imageFile: any = null;
        for (const file of result.files) {
          if (file.mediaType?.startsWith("image/")) {
            console.log("Found image file:", file);
            imageFile = file;
            break;
          }
        }

        if (!imageFile) {
          throw new Error("No image generated in response");
        }

        // Convert the image data to buffer for upload
        let imageBuffer: Buffer;
        if (imageFile.base64Data) {
          // Handle base64 data format from Gemini
          imageBuffer = Buffer.from(imageFile.base64Data, "base64");
        } else if (imageFile.data instanceof Uint8Array) {
          imageBuffer = Buffer.from(imageFile.data);
        } else if (typeof imageFile.data === "string") {
          imageBuffer = Buffer.from(imageFile.data, "base64");
        } else {
          console.error("Image file structure:", imageFile);
          throw new Error("Unsupported image data format");
        }

        // Create file object for upload
        const file = new File(
          [new Uint8Array(imageBuffer)],
          "generated-image.png",
          {
            type: imageFile.mediaType || "image/png",
          }
        );

        // Upload to R2
        const uploadResult = await r2Upload.uploadImage(file, {
          fileName: `ai-generated/${generateUUID()}.png`,
          bucketType: "jatevo-web",
        });

        // Cache the URL
        await setCache(cacheKey, uploadResult.url);

        return { imageUrl: uploadResult.url, success: true, cached: false };
      } catch (error) {
        console.error("Image generation error:", error);
        throw new Error(
          `Failed to generate image: ${error instanceof Error ? error.message : "Unknown error"}`
        );
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
