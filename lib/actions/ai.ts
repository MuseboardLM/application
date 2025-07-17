// lib/actions/ai.ts - AI-related actions
"use server";

import { createServer } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { MuseItem, ShadowContext } from "@/lib/types";

/**
 * Get Shadow context for AI processing
 */
export async function getShadowContext(): Promise<ShadowContext | null> {
  const supabase = await createServer();
  
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    return null;
  }

  try {
    const { data: mission } = await supabase
      .from("user_missions")
      .select("mission_statement")
      .eq("user_id", user.id)
      .single();

    if (!mission?.mission_statement) {
      return null;
    }

    const { data: recentItems } = await supabase
      .from("muse_items")
      .select("*")
      .eq("user_id", user.id)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(50);

    const { count: totalItems } = await supabase
      .from("muse_items")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .is("deleted_at", null);

    const allCategories = (recentItems || [])
      .flatMap(item => item.ai_categories || [])
      .filter(Boolean);
    
    const categoryCounts = allCategories.reduce((acc, cat) => {
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topCategories = Object.entries(categoryCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([cat]) => cat);

    const contentTypeCounts = (recentItems || []).reduce((acc, item) => {
      acc[item.content_type] = (acc[item.content_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const preferredContentTypes = Object.entries(contentTypeCounts)
      .sort(([,a], [,b]) => b - a)
      .map(([type]) => type);

    const { data: activeConversation } = await supabase
      .from("ai_conversations")
      .select("id")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .single();

    let conversationHistory: any[] = [];
    if (activeConversation) {
      const { data: messages } = await supabase
        .from("ai_messages")
        .select("*")
        .eq("conversation_id", activeConversation.id)
        .order("created_at", { ascending: false })
        .limit(20);
      
      conversationHistory = (messages || []).reverse();
    }

    return {
      mission: mission.mission_statement,
      recentItems: (recentItems || []) as MuseItem[],
      totalItems: totalItems || 0,
      topCategories,
      userPreferences: {
        contentTypes: preferredContentTypes,
        categories: topCategories,
        sources: [],
      },
      conversationHistory,
    };

  } catch (error) {
    console.error("Error getting Shadow context:", error);
    return null;
  }
}

/**
 * Get items pending AI processing
 */
export async function getItemsPendingAIProcessing(): Promise<MuseItem[]> {
  const supabase = await createServer();
  
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    return [];
  }

  const { data: items } = await supabase
    .from("muse_items")
    .select("*")
    .eq("user_id", user.id)
    .eq("ai_status", "pending")
    .is("deleted_at", null)
    .order("created_at", { ascending: true });

  return (items || []) as MuseItem[];
}

/**
 * Update AI processing status for an item
 */
export async function updateAIStatus(
  itemId: string, 
  status: "pending" | "processing" | "completed" | "failed",
  result?: {
    categories?: string[];
    clusters?: string[];
    summary?: string;
    insights?: string;
    relevanceScore?: number;
  }
) {
  const supabase = await createServer();
  
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    return { success: false, error: "Authentication required" };
  }

  const updateData: any = {
    ai_status: status,
    updated_at: new Date().toISOString(),
  };

  if (result) {
    if (result.categories) updateData.ai_categories = result.categories;
    if (result.clusters) updateData.ai_clusters = result.clusters;
    if (result.summary) updateData.ai_summary = result.summary;
    if (result.insights) updateData.ai_insights = result.insights;
    if (result.relevanceScore !== undefined) updateData.ai_relevance_score = result.relevanceScore;
  }

  const { error } = await supabase
    .from("muse_items")
    .update(updateData)
    .eq("id", itemId)
    .eq("user_id", user.id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/museboard");
  return { success: true };
}