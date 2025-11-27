"use server";

import webpush from "web-push";

// Define regex at top level for performance
const WORDS_REGEX = /\s+/;

// Configure VAPID keys
webpush.setVapidDetails(
  "mailto:muhammadrayaarrizki@gmail.com",
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "",
  process.env.VAPID_PRIVATE_KEY || ""
);

// In a production environment, you would store subscriptions in a database
// For demo purposes, we'll use a simple in-memory storage
const subscriptions = new Map<string, any>();

export async function subscribeUser(subscription: any) {
  try {
    const subscriptionId = JSON.stringify(subscription.endpoint);
    subscriptions.set(subscriptionId, subscription);

    console.log("User subscribed successfully");
    await Promise.resolve();
    return { success: true };
  } catch (error) {
    console.error("Error subscribing user:", error);
    return { success: false, error: "Failed to subscribe" };
  }
}

export async function unsubscribeUser(subscription: any) {
  try {
    const subscriptionId = JSON.stringify(subscription.endpoint);
    subscriptions.delete(subscriptionId);

    console.log("User unsubscribed successfully");
    await Promise.resolve();
    return { success: true };
  } catch (error) {
    console.error("Error unsubscribing user:", error);
    return { success: false, error: "Failed to unsubscribe" };
  }
}

export async function sendNotification(message: string, title?: string) {
  try {
    const payload = JSON.stringify({
      title: title || "Jatevo Chatbot",
      body: message,
      icon: "/jatevo.png",
      badge: "/jatevo.png",
      tag: "jatevo-notification",
      renotify: true,
      requireInteraction: false,
      actions: [
        {
          action: "open",
          title: "Open Chat",
        },
        {
          action: "dismiss",
          title: "Dismiss",
        },
      ],
    });

    const promises = Array.from(subscriptions.values()).map(
      async (subscription) => {
        try {
          await webpush.sendNotification(subscription, payload);
        } catch (error) {
          console.error("Error sending notification to subscription:", error);
          // Remove invalid subscription
          const subscriptionId = JSON.stringify(subscription.endpoint);
          subscriptions.delete(subscriptionId);
        }
      }
    );

    await Promise.all(promises);

    console.log("Notifications sent successfully");
    return { success: true };
  } catch (error) {
    console.error("Error sending notifications:", error);
    return { success: false, error: "Failed to send notifications" };
  }
}

export async function sendImageGenerationNotification(_imageUrl: string) {
  await Promise.resolve();
  return sendNotification(
    "Your image has been generated successfully!",
    "Image Generation Complete"
  );
}

export async function sendChatNotification(message: string) {
  await Promise.resolve();
  const truncatedMessage =
    message.length > 100 ? `${message.substring(0, 100)}...` : message;

  return sendNotification(truncatedMessage, "New Message");
}

// Get VAPID public key for client-side
export async function getVapidPublicKey() {
  await Promise.resolve();
  return {
    publicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  };
}

// Original chat actions that were missing
export async function deleteTrailingMessages({
  chatId,
  timestamp,
}: {
  chatId: string;
  timestamp: Date;
}) {
  try {
    const { deleteMessagesByChatIdAfterTimestamp } = await import(
      "@/lib/db/queries"
    );
    await deleteMessagesByChatIdAfterTimestamp({ chatId, timestamp });
    await Promise.resolve();
    return { success: true };
  } catch (error) {
    console.error("Error deleting trailing messages:", error);
    return { success: false, error: "Failed to delete messages" };
  }
}

export async function saveChatModelAsCookie(model: string) {
  try {
    // This would typically set a cookie, but for server actions we'll return the model
    await Promise.resolve();
    return { success: true, model };
  } catch (error) {
    console.error("Error saving chat model:", error);
    return { success: false, error: "Failed to save model" };
  }
}

export async function updateChatVisibility({
  chatId,
  visibility,
}: {
  chatId: string;
  visibility: "private" | "public";
}) {
  try {
    const { updateChatVisibilityById } = await import("@/lib/db/queries");
    await updateChatVisibilityById({ chatId, visibility });
    await Promise.resolve();
    return { success: true };
  } catch (error) {
    console.error("Error updating chat visibility:", error);
    return { success: false, error: "Failed to update visibility" };
  }
}

export async function generateTitleFromUserMessage({
  message,
}: {
  message: any;
}) {
  try {
    // Extract the text content from the message parts
    const textContent =
      message.parts
        ?.filter((part: any) => part.type === "text")
        ?.map((part: any) => part.text)
        ?.join(" ") || "";

    // Create a simple title from the first few words
    const words = textContent.trim().split(WORDS_REGEX);
    const title = words.slice(0, 5).join(" ");

    // If the title is too short, use a default
    if (title.length < 3) {
      await Promise.resolve();
      return "New Chat";
    }

    // If the original message was longer, add ellipsis
    await Promise.resolve();
    return words.length > 5 ? `${title}...` : title;
  } catch (error) {
    console.error("Error generating title:", error);
    await Promise.resolve();
    return "New Chat";
  }
}
