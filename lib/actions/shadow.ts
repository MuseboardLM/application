// lib/actions/shadow.ts

"use server";

import { createServer } from "@/lib/supabase/server";
import { getShadowContext } from "@/lib/actions/mission";
import { getOrCreateActiveConversation } from "@/lib/actions/mission";
import { ActionResult, ShadowContext } from "@/lib/types";

// The URL for your Python AI service. 
// For local development, this is the default Uvicorn address.
const AI_SERVICE_URL = "http://127.0.0.1:8000/api/v1/shadow/chat";

/**
 * Sends a message to the Shadow AI service and returns the response.
 */
export async function chatWithShadowAction(
  userMessage: string
): Promise<ActionResult<{ response: string }>> {
  
  const supabase = createServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Authentication required." };
  }

  if (!userMessage || userMessage.trim().length === 0) {
    return { success: false, error: "Message cannot be empty." };
  }

  try {
    // 1. Get the complete user context for the AI
    const shadowContext = await getShadowContext();
    if (!shadowContext) {
      return { success: false, error: "Could not retrieve user context." };
    }

    // 2. Get the active conversation ID
    const activeConversation = await getOrCreateActiveConversation();
    if (!activeConversation) {
        return { success: false, error: "Could not establish a conversation." };
    }

    // 3. Call the Python AI Service API
    const response = await fetch(AI_SERVICE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        context: shadowContext,
        user_message: userMessage,
        conversation_id: activeConversation.id
      }),
    });

    if (!response.ok) {
      const errorBody = await response.json();
      throw new Error(errorBody.detail || "Failed to get response from AI service");
    }

    const responseData = await response.json();

    return { success: true, data: responseData };

  } catch (error) {
    console.error("Error in chatWithShadowAction:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred.",
    };
  }
}