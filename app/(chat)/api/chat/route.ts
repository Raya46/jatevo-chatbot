import {
  convertToModelMessages,
  createUIMessageStream,
  JsonToSseTransformStream,
  smoothStream,
  stepCountIs,
  streamText,
} from "ai";
import { unstable_cache as cache } from "next/cache";
import { after } from "next/server";
import {
  createResumableStreamContext,
  type ResumableStreamContext,
} from "resumable-stream";
import type { ModelCatalog } from "tokenlens/core";
import { fetchModels } from "tokenlens/fetch";
import { getUsage } from "tokenlens/helpers";
import { auth, type UserType } from "@/app/(auth)/auth";
import type { VisibilityType } from "@/components/visibility-selector";
import { entitlementsByUserType } from "@/lib/ai/entitlements";
import type { ChatModel } from "@/lib/ai/models";
import { myProvider } from "@/lib/ai/providers";
import { createDocument } from "@/lib/ai/tools/create-document";
import { generateImageTool } from "@/lib/ai/tools/generate-image";
import { getWeather } from "@/lib/ai/tools/get-weather";
import { requestSuggestions } from "@/lib/ai/tools/request-suggestions";
import { updateDocument } from "@/lib/ai/tools/update-document";
import { isProductionEnvironment } from "@/lib/constants";
import {
  createStreamId,
  deleteChatById,
  getChatById,
  getMessageCountByUserId,
  getMessagesByChatId,
  saveChat,
  saveMessages,
  updateChatLastContextById,
} from "@/lib/db/queries";
import type { DBMessage } from "@/lib/db/schema";
import { ChatSDKError } from "@/lib/errors";
import type { ChatMessage } from "@/lib/types";
import type { AppUsage } from "@/lib/usage";
import { convertToUIMessages, generateUUID } from "@/lib/utils";
import { generateTitleFromUserMessage } from "../../actions";
import { type PostRequestBody, postRequestBodySchema } from "./schema";

export const maxDuration = 60;

let globalStreamContext: ResumableStreamContext | null = null;

const getTokenlensCatalog = cache(
  async (): Promise<ModelCatalog | undefined> => {
    try {
      return await fetchModels();
    } catch (err) {
      console.warn(
        "TokenLens: catalog fetch failed, using default catalog",
        err
      );
      return; // tokenlens helpers will fall back to defaultCatalog
    }
  },
  ["tokenlens-catalog"],
  { revalidate: 24 * 60 * 60 } // 24 hours
);

export function getStreamContext() {
  if (!globalStreamContext) {
    try {
      globalStreamContext = createResumableStreamContext({
        waitUntil: after,
      });
    } catch (error: any) {
      if (error.message.includes("REDIS_URL")) {
        console.log(
          " > Resumable streams are disabled due to missing REDIS_URL"
        );
      } else {
        console.error(error);
      }
    }
  }

  return globalStreamContext;
}

export async function POST(request: Request) {
  let requestBody: PostRequestBody;

  try {
    const json = await request.json();
    requestBody = postRequestBodySchema.parse(json);
  } catch (_) {
    return new ChatSDKError("bad_request:api").toResponse();
  }

  try {
    const {
      id,
      message,
      selectedChatModel,
      selectedVisibilityType,
    }: {
      id: string;
      message: ChatMessage;
      selectedChatModel: ChatModel["id"];
      selectedVisibilityType: VisibilityType;
    } = requestBody;

    const session = await auth();

    if (!session?.user) {
      return new ChatSDKError("unauthorized:chat").toResponse();
    }

    const userType: UserType = session.user.type;

    const messageCount = await getMessageCountByUserId({
      id: session.user.id,
      differenceInHours: 24,
    });

    if (messageCount > entitlementsByUserType[userType].maxMessagesPerDay) {
      return new ChatSDKError("rate_limit:chat").toResponse();
    }

    const chat = await getChatById({ id });
    let messagesFromDb: DBMessage[] = [];

    if (chat) {
      if (chat.userId !== session.user.id) {
        return new ChatSDKError("forbidden:chat").toResponse();
      }
      // Only fetch messages if chat already exists
      messagesFromDb = await getMessagesByChatId({ id });
    } else {
      const title = await generateTitleFromUserMessage({
        message,
      });

      await saveChat({
        id,
        userId: session.user.id,
        title,
        visibility: selectedVisibilityType,
      });
      // New chat - no need to fetch messages, it's empty
    }

    // Convert messages and limit context window to prevent context_length_exceeded
    const allMessages = [...convertToUIMessages(messagesFromDb), message];

    // Keep only last 3 messages to stay within context limits
    // This prevents context_length_exceeded errors
    // 3 messages is extremely conservative and safe for image generation
    const uiMessages = allMessages.slice(-3);

    // If we truncated messages, log it for debugging
    if (allMessages.length > 3) {
      console.log(
        `Context window truncated: ${allMessages.length} -> ${uiMessages.length} messages`
      );
    }

    // System prompt based on model type
    const isToolModel = selectedChatModel === "tool-model";

    const systemPrompt = isToolModel
      ? `You are a helpful assistant with access to tools that you MUST execute when needed.

CRITICAL TOOL USAGE RULES:
• When users ask for images, you MUST execute the generateImageTool function immediately
• Do NOT describe what you would generate - ACTUALLY CALL THE TOOL
• When you need to use a tool, CALL THE TOOL FUNCTION - do not return JSON describing the tool call
• NEVER return JSON like {"tool": "generateImageTool", "arguments": {...}} - instead, actually call the tool
• Focus on answering the user's request by executing tools when needed

IMAGE GENERATION:
• Any request for visual content requires EXECUTING generateImageTool
• Examples: "create an image", "generate a picture", "draw me", "make a picture of", "buat gambar", "gambar", "foto"
• When you detect an image request, EXECUTE generateImageTool immediately with a descriptive prompt
• Do NOT explain what you're doing - just EXECUTE the tool

TOOL EXECUTION:
• When you decide to use a tool, EXECUTE it by calling the tool function
• Do NOT describe the tool call in text
• Do NOT return JSON describing the tool call
• Actually CALL the tool function

RESPONSE STYLE:
• Be helpful and direct
• Provide clear and concise answers
• Respond in the user's language when possible

IMPORTANT: NEVER return tool call descriptions as text. ALWAYS execute the actual tool function.`
      : `You are a helpful assistant with advanced reasoning capabilities. Provide clear, accurate, and thoughtful responses to help users with their questions and tasks.

CAPABILITIES:
• Strong reasoning and problem-solving skills
• Multi-language support (English, Indonesian, Spanish, French, etc.)
• Ability to understand context and provide relevant information
• Clear and structured communication

IMPORTANT NOTE ABOUT TOOLS:
• You do NOT have access to tools like image generation, weather checking, or document creation
• If the user asks for image generation, weather information, or other tool-based features, politely recommend switching to "Gemini 2.5 Flash" model
• Example: "I notice you're asking for image generation. For that feature, please switch to the 'Gemini 2.5 Flash' model which has tool calling capabilities."

RESPONSE STYLE:
• Be helpful and direct
• Provide clear and concise answers
• Do not include your internal reasoning process in responses unless specifically asked
• Respond in the user's language when possible

CRITICAL FORMATTING RULES:
• NEVER use markdown tables (format: | Header | Header |)
• NEVER use pipe characters | to create table structures
• ALWAYS use bullet points (•) or numbered lists (1., 2., 3.) instead of tables
• For comparisons, use bullet points with bold headings: **Performance:** • Point 1 • Point 2
• For structured information, use nested bullet points with proper indentation
• Keep responses clean and readable without complex table formatting`;

    await saveMessages({
      messages: [
        {
          chatId: id,
          id: message.id,
          role: "user",
          parts: message.parts,
          attachments: [],
          createdAt: new Date(),
        },
      ],
    });

    const streamId = generateUUID();
    await createStreamId({ streamId, chatId: id });

    let finalMergedUsage: AppUsage | undefined;

    const stream = createUIMessageStream({
      execute: ({ writer: dataStream }) => {
        // Configure based on model type
        const modelToUse = isToolModel
          ? myProvider.languageModel("tool-model")
          : myProvider.languageModel(selectedChatModel);

        const result = streamText({
          model: modelToUse,
          system: systemPrompt,
          messages: convertToModelMessages(uiMessages),
          stopWhen: stepCountIs(5),
          tools: isToolModel
            ? {
                getWeather,
                createDocument: createDocument({ session, dataStream }),
                updateDocument: updateDocument({ session, dataStream }),
                requestSuggestions: requestSuggestions({
                  session,
                  dataStream,
                }),
                generateImageTool: generateImageTool(),
              }
            : undefined,
          toolChoice: isToolModel ? "auto" : "none",
          experimental_transform: smoothStream({ chunking: "word" }),
          experimental_telemetry: {
            isEnabled: isProductionEnvironment,
            functionId: "stream-text",
          },
          onFinish: async ({ usage }) => {
            try {
              const providers = await getTokenlensCatalog();
              const modelId =
                myProvider.languageModel(selectedChatModel).modelId;
              if (!modelId) {
                finalMergedUsage = usage;
                dataStream.write({
                  type: "data-usage",
                  data: finalMergedUsage,
                });
                return;
              }

              if (!providers) {
                finalMergedUsage = usage;
                dataStream.write({
                  type: "data-usage",
                  data: finalMergedUsage,
                });
                return;
              }

              const summary = getUsage({ modelId, usage, providers });
              finalMergedUsage = { ...usage, ...summary, modelId } as AppUsage;
              dataStream.write({ type: "data-usage", data: finalMergedUsage });
            } catch (err) {
              console.warn("TokenLens enrichment failed", err);
              finalMergedUsage = usage;
              dataStream.write({ type: "data-usage", data: finalMergedUsage });
            }
          },
        });

        result.consumeStream();

        dataStream.merge(
          result.toUIMessageStream({
            sendReasoning: true,
          })
        );
      },
      generateId: generateUUID,
      onFinish: async ({ messages }) => {
        await saveMessages({
          messages: messages.map((currentMessage) => ({
            id: currentMessage.id,
            role: currentMessage.role,
            parts: currentMessage.parts,
            createdAt: new Date(),
            attachments: [],
            chatId: id,
          })),
        });

        if (finalMergedUsage) {
          try {
            await updateChatLastContextById({
              chatId: id,
              context: finalMergedUsage,
            });
          } catch (err) {
            console.warn("Unable to persist last usage for chat", id, err);
          }
        }
      },
      onError: () => {
        return "Oops, an error occurred!";
      },
    });

    // const streamContext = getStreamContext();

    // if (streamContext) {
    //   return new Response(
    //     await streamContext.resumableStream(streamId, () =>
    //       stream.pipeThrough(new JsonToSseTransformStream())
    //     )
    //   );
    // }

    return new Response(stream.pipeThrough(new JsonToSseTransformStream()));
  } catch (error) {
    const vercelId = request.headers.get("x-vercel-id");

    if (error instanceof ChatSDKError) {
      return error.toResponse();
    }

    // Check for context length exceeded error (works for both OpenAI and Gemini)
    if (
      error instanceof Error &&
      (error.message?.includes("context_length_exceeded") ||
        error.message?.includes("exceeds the context window") ||
        error.message?.includes("MAX_TOKENS") ||
        error.message?.includes("tokens exceeds"))
    ) {
      console.warn("Context length exceeded, suggesting conversation restart", {
        vercelId,
      });
      return new ChatSDKError("offline:chat").toResponse();
    }

    // Check for rate limit error (works for both OpenAI and Gemini)
    if (
      error instanceof Error &&
      (error.message?.includes("rate_limit_exceeded") ||
        error.message?.includes("Too Many Requests") ||
        error.message?.includes("429") ||
        error.message?.includes("RESOURCE_EXHAUSTED") ||
        error.message?.includes("QUOTA_EXCEEDED"))
    ) {
      console.warn("Rate limit exceeded, please try again later", { vercelId });
      return new ChatSDKError("rate_limit:chat").toResponse();
    }

    // Check for Google Gemini specific errors
    if (
      error instanceof Error &&
      (error.message?.includes("GOOGLE_GENERATIVE_AI_API_KEY") ||
        error.message?.includes("API_KEY_INVALID") ||
        error.message?.includes("PERMISSION_DENIED"))
    ) {
      console.warn("Google API key issue detected", { vercelId });
      return new ChatSDKError("bad_request:api").toResponse();
    }

    // Check for Vercel AI Gateway credit card error
    if (
      error instanceof Error &&
      error.message?.includes(
        "AI Gateway requires a valid credit card on file to service requests"
      )
    ) {
      return new ChatSDKError("bad_request:activate_gateway").toResponse();
    }

    console.error("Unhandled error in chat API:", error, { vercelId });
    return new ChatSDKError("offline:chat").toResponse();
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return new ChatSDKError("bad_request:api").toResponse();
  }

  const session = await auth();

  if (!session?.user) {
    return new ChatSDKError("unauthorized:chat").toResponse();
  }

  const chat = await getChatById({ id });

  if (chat?.userId !== session.user.id) {
    return new ChatSDKError("forbidden:chat").toResponse();
  }

  const deletedChat = await deleteChatById({ id });

  return Response.json(deletedChat, { status: 200 });
}
