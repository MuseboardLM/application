// lib/actions/chat.ts - Chat/conversation actions
"use server";

import { createServer } from "@/lib/supabase/server";

/**
 * Save AI conversation message
 */
export async function saveAIMessage(
  conversationId: string,
  role: "user" | "assistant" | "system",
  content: string,
  metadata?: any
) {
  const supabase = createServer();
  
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    return { success: false, error: "Authentication required" };
  }

  const { data: conversation } = await supabase
    .from("ai_conversations")
    .select("user_id")
    .eq("id", conversationId)
    .single();

  if (!conversation || conversation.user_id !== user.id) {
    return { success: false, error: "Conversation not found" };
  }

  const { error } = await supabase
    .from("ai_messages")
    .insert({
      conversation_id: conversationId,
      role,
      content,
      metadata: metadata || {},
    });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Get or create active AI conversation for user
 */
export async function getOrCreateActiveConversation() {
  const supabase = createServer();
  
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    return null;
  }

  const { data: conversation } = await supabase
    .from("ai_conversations")
    .select("*")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .single();

  if (conversation) {
    return conversation;
  }

  const { data: newConversation, error } = await supabase
    .from("ai_conversations")
    .insert({
      user_id: user.id,
      title: "Chat with Shadow",
      is_active: true,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating conversation:", error);
    return null;
  }

  return newConversation;
}

/**
 * Get conversation messages
 */
export async function getConversationMessages(conversationId: string, limit = 50) {
  const supabase = createServer();
  
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    return [];
  }

  const { data: conversation } = await supabase
    .from("ai_conversations")
    .select("user_id")
    .eq("id", conversationId)
    .single();

  if (!conversation || conversation.user_id !== user.id) {
    return [];
  }

  const { data: messages } = await supabase
    .from("ai_messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })
    .limit(limit);

  return messages || [];
}