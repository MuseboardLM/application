// lib/actions/shadow.ts

"use server";

import { createServer } from "@/lib/supabase/server";
import { getShadowContext, getOrCreateActiveConversation } from "@/lib/actions";
import type { ActionResult, MuseItem } from "@/lib/types";

// The base URL for your Python AI service.
// For local development, this is the default Uvicorn address.
const AI_SERVICE_BASE_URL = process.env.AI_SERVICE_URL || "http://127.0.0.1:8000/api/v1/shadow";

/**
 * Sends a message to the Shadow AI service for a regular chat conversation.
 */
export async function chatWithShadowAction(
  userMessage: string
): Promise<ActionResult<{ response: string }>> {
  
  const supabase = await createServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Authentication required." };
  }

  if (!userMessage || userMessage.trim().length === 0) {
    return { success: false, error: "Message cannot be empty." };
  }

  try {
    const shadowContext = await getShadowContext();
    if (!shadowContext) {
      return { success: false, error: "Could not retrieve user context." };
    }

    const activeConversation = await getOrCreateActiveConversation();
    if (!activeConversation) {
        return { success: false, error: "Could not establish a conversation." };
    }

    const response = await fetch(`${AI_SERVICE_BASE_URL}/chat`, {
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


/**
 * Sends a search query to the AI service for Retrieval-Augmented Generation (RAG).
 * This action is specifically for the Museboard search feature.
 */
export async function searchMuseboardAction(
  query: string
): Promise<ActionResult<{ answer: string; sources: MuseItem[] }>> {
  const supabase = await createServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Authentication required." };
  }
  if (!query || query.trim().length === 0) {
    return { success: false, error: "Search query cannot be empty." };
  }

  try {
    // Call the /search endpoint of your Python AI service
    const response = await fetch(`${AI_SERVICE_BASE_URL}/search`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: query,
        user_id: user.id, // Pass the user_id for RLS in the vector search
      }),
    });

    if (!response.ok) {
      const errorBody = await response.json();
      throw new Error(errorBody.detail || "Failed to get search response from AI service");
    }

    const responseData = await response.json();
    // The AI service returns an object with 'answer' and 'sources'
    return { success: true, data: responseData };

  } catch (error) {
    console.error("Error in searchMuseboardAction:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred during search.",
    };
  }
}
