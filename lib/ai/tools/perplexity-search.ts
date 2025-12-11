import { generateText, tool } from "ai";
import { z } from "zod";
import { openrouter } from "../providers";

export const perplexitySearchTool = () =>
  tool({
    description: `Search the internet for real-time information using Perplexity Sonar model via OpenRouter.
    This tool should be used when users ask for:
    - Latest news or current events
    - Real-time data or statistics
    - Recent updates on topics
    - Information that changes over time
    - Explicit search requests with words like "search", "cari", "cek", "googling"
    - Questions about current status: "what is ... now?", "how much ... today?"
    - References or sources from the web
    
    DO NOT use this tool for:
    - Opinion-based questions
    - General knowledge or concepts
    - Questions that can be answered from training data`,

    inputSchema: z.object({
      query: z.string().describe("The search query to look up on the internet"),
    }),

    execute: async ({ query }) => {
      try {
        console.log(`[Perplexity Search] Searching for: ${query}`);

        // Check API key
        if (!process.env.OPENROUTER_API_KEY) {
          throw new Error("OPENROUTER_API_KEY is not configured");
        }

        console.log(
          "[Perplexity Search] Using OpenRouter with Perplexity Sonar..."
        );

        // Use OpenRouter with Perplexity Sonar model
        const result = await generateText({
          model: openrouter.chat("perplexity/sonar"),
          prompt: query,
          temperature: 0.1,
          maxOutputTokens: 100,
          maxRetries: 3,
        });

        const content = result.text;
        const sources = result.sources || [];

        console.log(
          `[Perplexity Search] Success! Content length: ${content.length}, Sources: ${sources.length}`
        );

        // Format sources if available
        const sourcesList: Array<{ title: string; url: string }> = [];
        if (sources.length > 0) {
          sourcesList.push(
            ...sources.map((source: any) => ({
              title: source.title || "Source",
              url: source.url || "#",
            }))
          );
        }

        return {
          results: sourcesList.map((source) => ({
            title: source.title,
            url: source.url,
            snippet: `${content.slice(0, 200)}...`,
          })),
          id: `search-${Date.now()}`,
          content,
          sources: sourcesList,
          success: true,
        };
      } catch (error) {
        console.error("[Perplexity Search] Error:", error);

        // Handle specific errors
        if (error instanceof Error) {
          if (error.message.includes("API key")) {
            return {
              results: [],
              id: `search-error-${Date.now()}`,
              content: `Search authentication error: ${error.message}. Please check your OpenRouter API key configuration.`,
              sources: [],
              success: false,
            };
          }
          if (
            error.message.includes("429") ||
            error.message.includes("rate limit")
          ) {
            return {
              results: [],
              id: `search-error-${Date.now()}`,
              content: "Rate limit exceeded. Please try again in a moment.",
              sources: [],
              success: false,
            };
          }
        }

        // Handle other errors
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error occurred";
        return {
          results: [],
          id: `search-error-${Date.now()}`,
          content: `Search failed: ${errorMessage}. Please try again or rephrase your query.`,
          sources: [],
          success: false,
        };
      }
    },
  });
