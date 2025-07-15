// lib/actions/onboarding.ts

"use server";

import { createServer } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { ActionResult, Hero, Interest } from "@/lib/types";

// Ensure your AI service URL is correctly set in your .env.local file
const AI_SERVICE_BASE_URL = process.env.AI_SERVICE_URL || "http://127.0.0.1:8000/api/v1";

/**
 * Saves the user's mission statement to the database.
 * This remains largely the same but is now more focused on its single task.
 */
export async function saveMissionAction(missionStatement: string): Promise<ActionResult<{ mission: string }>> {
  const supabase = createServer();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return { success: false, error: "Authentication required" };
  }

  try {
    const { data, error } = await supabase
      .from("user_missions")
      .upsert({
        user_id: user.id,
        mission_statement: missionStatement,
        onboarding_completed: false, // Ensure this is false until the final step
      }, { onConflict: 'user_id' })
      .select()
      .single();

    if (error) throw error;

    revalidatePath("/onboarding");
    return { success: true, data: { mission: data.mission_statement } };

  } catch (error) {
    console.error("Error saving mission:", error);
    return { success: false, error: "Failed to save mission." };
  }
}

/**
 * NEW: Fetches AI-powered suggestions for heroes and interests.
 */
export async function getInspirationSuggestionsAction(mission: string): Promise<ActionResult<{ heroes: Hero[]; interests: Interest[] }>> {
  try {
    const response = await fetch(`${AI_SERVICE_BASE_URL}/onboarding/suggestions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mission }),
    });

    if (!response.ok) {
      throw new Error(`AI service failed with status: ${response.status}`);
    }

    const data = await response.json();
    return { success: true, data: { heroes: data.heroes || [], interests: data.interests || [] } };

  } catch (error) {
    console.error("Error fetching inspiration suggestions:", error);
    return { success: false, error: "Could not get suggestions from Shadow. Please try again." };
  }
}


/**
 * NEW: Saves heroes/interests, populates the Museboard, and completes onboarding.
 */
export async function saveInspirationAndCompleteOnboardingAction(
  heroes: string[], 
  interests: string[]
): Promise<ActionResult<{ items_added: number }>> {
  const supabase = createServer();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return { success: false, error: "Authentication required" };
  }

  try {
    // 1. Get user's mission from DB
    const { data: missionData, error: missionError } = await supabase
      .from("user_missions")
      .select("mission_statement")
      .eq("user_id", user.id)
      .single();

    if (missionError || !missionData) throw new Error("Mission not found.");
    
    // 2. Save heroes and interests to the user's mission record
    const { error: updateError } = await supabase
      .from("user_missions")
      .update({
        heroes: heroes,      // Storing as a JSON array of strings
        interests: interests,  // Storing as a JSON array of strings
      })
      .eq("user_id", user.id);

    if (updateError) throw updateError;
    
    // 3. Call AI Service to get curated content
    const response = await fetch(`${AI_SERVICE_BASE_URL}/onboarding/content/curate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mission: missionData.mission_statement,
        heroes: heroes,
        interests: interests
      }),
    });

    if (!response.ok) throw new Error('AI content curation failed.');

    const curatedResult = await response.json();
    const contentItems = curatedResult.content.map((item: any) => ({
      user_id: user.id,
      content: item.content,
      content_type: "text",
      description: item.source,
      ai_status: "completed",
      ai_categories: [item.category],
      ai_summary: item.relevance_reason,
      ai_relevance_score: 0.9,
    }));
    
    // 4. Insert curated content into muse_items
    const { error: insertError } = await supabase.from("muse_items").insert(contentItems);
    if (insertError) throw insertError;

    // 5. Mark onboarding as complete
    const { error: completeError } = await supabase
      .from("user_missions")
      .update({ onboarding_completed: true })
      .eq("user_id", user.id);
      
    if (completeError) throw completeError;

    // 6. Revalidate paths and return success
    revalidatePath("/museboard");
    revalidatePath("/onboarding");

    return { success: true, data: { items_added: contentItems.length } };

  } catch (error) {
    console.error("Error in final onboarding step:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return { success: false, error: `Failed to complete setup: ${errorMessage}` };
  }
}