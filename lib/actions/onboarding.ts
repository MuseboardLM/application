// lib/actions/onboarding.ts

"use server";

import { createServer } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/lib/types";

const AI_SERVICE_BASE_URL = process.env.AI_SERVICE_URL || "http://127.0.0.1:8000/api/v1";

/**
 * Simple mission save action
 */
export async function saveMissionAction(missionStatement: string): Promise<ActionResult<{ success: boolean }>> {
  const supabase = createServer();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return { success: false, error: "Authentication required" };
  }

  try {
    // Save/update mission
    await supabase
      .from("user_missions")
      .upsert({
        user_id: user.id,
        mission_statement: missionStatement,
        onboarding_completed: false,
      });

    revalidatePath("/onboarding");
    return { success: true, data: { success: true } };

  } catch (error) {
    console.error("Error saving mission:", error);
    return { success: false, error: "Failed to save mission" };
  }
}

/**
 * Generate and populate initial Museboard content
 */
export async function populateInitialMuseboardAction(): Promise<ActionResult<{ items_added: number }>> {
  const supabase = createServer();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return { success: false, error: "Authentication required" };
  }

  try {
    // Get user's mission
    const { data: mission } = await supabase
      .from("user_missions")
      .select("mission_statement")
      .eq("user_id", user.id)
      .single();

    if (!mission?.mission_statement) {
      return { success: false, error: "Mission not found" };
    }

    // Try to call AI service for content curation
    let contentItems;
    
    try {
      const response = await fetch(`${AI_SERVICE_BASE_URL}/onboarding/content/curate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mission: mission.mission_statement,
          heroes: [], // We'll enhance this later
          interests: []
        }),
      });

      if (response.ok) {
        const result = await response.json();
        contentItems = result.content.map((item: any) => ({
          user_id: user.id,
          content: item.content,
          content_type: "text" as const,
          description: `${item.source} - ${item.relevance_reason}`,
          ai_status: "completed" as const,
          ai_categories: [item.category],
          ai_summary: item.relevance_reason,
          ai_relevance_score: 0.9,
          source_url: null,
        }));
      } else {
        throw new Error('AI service unavailable');
      }
    } catch (aiError) {
      console.warn('AI service unavailable, using fallback content');
      
      // Fallback curated content
      contentItems = [
        {
          user_id: user.id,
          content: "The way to get started is to quit talking and begin doing.",
          content_type: "text" as const,
          description: "Walt Disney - Taking action toward your goals",
          ai_status: "completed" as const,
          ai_categories: ["Action"],
          ai_summary: "Emphasizes the importance of taking action toward your mission",
          ai_relevance_score: 0.9,
          source_url: null,
        },
        {
          user_id: user.id,
          content: "Success is not final, failure is not fatal: it is the courage to continue that counts.",
          content_type: "text" as const,
          description: "Winston Churchill - Persistence in pursuit of goals",
          ai_status: "completed" as const,
          ai_categories: ["Resilience"],
          ai_summary: "Reminds us that persistence is key to achieving our mission",
          ai_relevance_score: 0.9,
          source_url: null,
        },
        {
          user_id: user.id,
          content: "The only way to do great work is to love what you do.",
          content_type: "text" as const,
          description: "Steve Jobs - Aligning passion with purpose",
          ai_status: "completed" as const,
          ai_categories: ["Passion"],
          ai_summary: "Aligns passion with purpose in pursuit of your goals",
          ai_relevance_score: 0.9,
          source_url: null,
        },
        {
          user_id: user.id,
          content: "Innovation distinguishes between a leader and a follower.",
          content_type: "text" as const,
          description: "Steve Jobs - The value of creative thinking",
          ai_status: "completed" as const,
          ai_categories: ["Innovation"],
          ai_summary: "Highlights the value of creative thinking and leadership",
          ai_relevance_score: 0.9,
          source_url: null,
        },
        {
          user_id: user.id,
          content: "Focus on being productive instead of busy.",
          content_type: "text" as const,
          description: "Tim Ferriss - Maintaining focus on what matters",
          ai_status: "completed" as const,
          ai_categories: ["Productivity"],
          ai_summary: "Helps maintain focus on what truly matters for your mission",
          ai_relevance_score: 0.9,
          source_url: null,
        }
      ];
    }

    // Insert content into muse_items
    const { error: insertError } = await supabase
      .from("muse_items")
      .insert(contentItems);

    if (insertError) {
      throw new Error(`Failed to insert content: ${insertError.message}`);
    }

    revalidatePath("/museboard");
    revalidatePath("/onboarding");
    
    return { success: true, data: { items_added: contentItems.length } };

  } catch (error) {
    console.error("Error populating Museboard:", error);
    return { success: false, error: "Failed to populate Museboard" };
  }
}

/**
 * Complete onboarding process
 */
export async function completeOnboardingAction(): Promise<ActionResult<{ success: boolean }>> {
  const supabase = createServer();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return { success: false, error: "Authentication required" };
  }

  try {
    // Mark onboarding as completed
    await supabase
      .from("user_missions")
      .update({ onboarding_completed: true })
      .eq("user_id", user.id);

    revalidatePath("/museboard");
    revalidatePath("/onboarding");
    
    return { success: true, data: { success: true } };

  } catch (error) {
    console.error("Error completing onboarding:", error);
    return { success: false, error: "Failed to complete onboarding" };
  }
}