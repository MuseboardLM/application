// lib/actions/mission.ts - Mission-specific actions only
"use server";

import { createServer } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { UserMission, MissionResult } from "@/lib/types";

const MissionSchema = z.object({
  mission_statement: z.string().min(10, "Please share at least 10 characters about your mission"),
});

/**
 * Create or update user mission
 */
export async function saveMissionAction(
  prevState: any,
  formData: FormData
): Promise<MissionResult> {
  const rawData = {
    mission_statement: formData.get("mission_statement") as string,
  };

  const validation = MissionSchema.safeParse(rawData);
  if (!validation.success) {
    return {
      success: false,
      error: "Please share more about your mission",
      fieldErrors: validation.error.flatten().fieldErrors as Record<string, string>,
    };
  }

  try {
    const supabase = await createServer();
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return {
        success: false,
        error: "You must be logged in to save your mission",
      };
    }

    const { data: existingMission } = await supabase
      .from("user_missions")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (existingMission) {
      const { error } = await supabase
        .from("user_missions")
        .update({
          mission_statement: validation.data.mission_statement,
        })
        .eq("user_id", user.id);

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }
    } else {
      const { error } = await supabase
        .from("user_missions")
        .insert({
          user_id: user.id,
          mission_statement: validation.data.mission_statement,
        });

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }
    }

    revalidatePath("/onboarding");
    return {
      success: true,
    };
  } catch (error) {
    return {
      success: false,
      error: "An unexpected error occurred",
    };
  }
}

/**
 * Complete onboarding process
 */
export async function completeOnboardingAction(): Promise<MissionResult> {
  try {
    const supabase = await createServer();
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return {
        success: false,
        error: "You must be logged in",
      };
    }

    const { error } = await supabase
      .from("user_missions")
      .update({ onboarding_completed: true })
      .eq("user_id", user.id);

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    revalidatePath("/museboard");
    return {
      success: true,
    };
  } catch (error) {
    return {
      success: false,
      error: "An unexpected error occurred",
    };
  }
}

/**
 * Get user mission
 */
export async function getUserMission(): Promise<UserMission | null> {
  const supabase = await createServer();
  
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    return null;
  }

  const { data: mission } = await supabase
    .from("user_missions")
    .select("*")
    .eq("user_id", user.id)
    .single();

  return mission;
}