// lib/actions/mission.ts

"use server";

import { createServer } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const MissionSchema = z.object({
  mission_statement: z.string().min(10, "Please share at least 10 characters about your mission"),
});

export type MissionResult = {
  success: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
};

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
    const supabase = createServer();
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return {
        success: false,
        error: "You must be logged in to save your mission",
      };
    }

    // Check if user already has a mission
    const { data: existingMission } = await supabase
      .from("user_missions")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (existingMission) {
      // Update existing mission
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
      // Create new mission
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
 * Upload file during onboarding
 */
export async function uploadOnboardingFileAction(formData: FormData): Promise<MissionResult> {
  try {
    const supabase = createServer();
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return {
        success: false,
        error: "You must be logged in to upload files",
      };
    }

    const file = formData.get("file") as File;
    if (!file) {
      return {
        success: false,
        error: "No file provided",
      };
    }

    // Generate unique filename with user folder structure
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${user.id}/${fileName}`; // This matches your RLS policy structure

    // Upload to Supabase storage with user folder structure
    const { error: uploadError } = await supabase.storage
      .from("muse-files")
      .upload(filePath, file);

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      return {
        success: false,
        error: `Failed to upload file: ${uploadError.message}`,
      };
    }

    // Add to muse_items table - store the full path
    const { error: dbError } = await supabase
      .from("muse_items")
      .insert({
        user_id: user.id,
        content: filePath, // Store the full path including user folder
        content_type: "image",
        description: "First inspiration added during onboarding",
      });

    if (dbError) {
      console.error("Database insert error:", dbError);
      
      // Clean up the uploaded file if database insert fails
      await supabase.storage
        .from("muse-files")
        .remove([filePath]);
      
      return {
        success: false,
        error: `Failed to save file record: ${dbError.message}`,
      };
    }

    revalidatePath("/onboarding");
    revalidatePath("/museboard");
    
    return {
      success: true,
    };
  } catch (error) {
    console.error("Unexpected error in uploadOnboardingFileAction:", error);
    return {
      success: false,
      error: "An unexpected error occurred while uploading",
    };
  }
}

/**
 * Complete onboarding process
 */
export async function completeOnboardingAction(): Promise<MissionResult> {
  try {
    const supabase = createServer();
    
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
 * Upload file for museboard (general purpose)
 */
export async function uploadFileToMuseboardAction(
  formData: FormData
): Promise<MissionResult & { data?: { filePath: string; publicUrl: string } }> {
  try {
    const supabase = createServer();
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return {
        success: false,
        error: "You must be logged in to upload files",
      };
    }

    const file = formData.get("file") as File;
    const contentType = formData.get("contentType") as string || "image";
    const description = formData.get("description") as string || null;
    const sourceUrl = formData.get("sourceUrl") as string || null;

    if (!file) {
      return {
        success: false,
        error: "No file provided",
      };
    }

    // Generate unique filename with user folder structure
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${user.id}/${fileName}`;

    // Upload to Supabase storage with user folder structure
    const { error: uploadError } = await supabase.storage
      .from("muse-files")
      .upload(filePath, file);

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      return {
        success: false,
        error: `Failed to upload file: ${uploadError.message}`,
      };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("muse-files")
      .getPublicUrl(filePath);

    // Add to muse_items table
    const { error: dbError } = await supabase
      .from("muse_items")
      .insert({
        user_id: user.id,
        content: filePath,
        content_type: contentType as any,
        description,
        source_url: sourceUrl,
      });

    if (dbError) {
      console.error("Database insert error:", dbError);
      
      // Clean up the uploaded file if database insert fails
      await supabase.storage
        .from("muse-files")
        .remove([filePath]);
      
      return {
        success: false,
        error: `Failed to save file record: ${dbError.message}`,
      };
    }

    revalidatePath("/museboard");
    
    return {
      success: true,
      data: {
        filePath,
        publicUrl: urlData.publicUrl,
      },
    };
  } catch (error) {
    console.error("Unexpected error in uploadFileToMuseboardAction:", error);
    return {
      success: false,
      error: "An unexpected error occurred while uploading",
    };
  }
}

/**
 * Add text or link content to museboard
 */
export async function addContentToMuseboardAction(
  content: string,
  contentType: "text" | "link",
  options: { description?: string; sourceUrl?: string } = {}
): Promise<MissionResult> {
  try {
    const supabase = createServer();
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return {
        success: false,
        error: "You must be logged in to add content",
      };
    }

    // Add to muse_items table
    const { error: dbError } = await supabase
      .from("muse_items")
      .insert({
        user_id: user.id,
        content,
        content_type: contentType,
        description: options.description || null,
        source_url: options.sourceUrl || null,
      });

    if (dbError) {
      console.error("Database insert error:", dbError);
      return {
        success: false,
        error: `Failed to save content: ${dbError.message}`,
      };
    }

    revalidatePath("/museboard");
    
    return {
      success: true,
    };
  } catch (error) {
    console.error("Unexpected error in addContentToMuseboardAction:", error);
    return {
      success: false,
      error: "An unexpected error occurred while saving content",
    };
  }
}

/**
 * Get user mission
 */
export async function getUserMission() {
  const supabase = createServer();
  
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