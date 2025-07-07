"use server";

import { createServer } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";

const MissionSchema = z.object({
  mission_statement: z.string().min(10, "Please share at least 10 characters about your mission"),
});

export type MissionResult = {
  success: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
  data?: any;
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
 * Enhanced upload action with compression and thumbnail generation
 */
export async function uploadFileToMuseboardAction(formData: FormData) {
  const supabase = createServer();

  try {
    // Check authentication
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return { success: false, error: "You must be logged in to upload files" };
    }

    const file = formData.get("file") as File;
    const contentType = formData.get("contentType") as string;
    const description = formData.get("description") as string;
    const imageWidth = formData.get("imageWidth") as string;
    const imageHeight = formData.get("imageHeight") as string;

    if (!file) {
      return { success: false, error: "No file provided" };
    }

    // Validate file type
    const allowedTypes = [
      "image/jpeg", "image/jpg", "image/png", "image/gif", 
      "image/webp", "image/svg+xml",
      "video/mp4", "video/webm", "video/quicktime"
    ];

    if (!allowedTypes.includes(file.type)) {
      return { success: false, error: "File type not supported" };
    }

    // Validate file size (max 10MB for original file)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return { success: false, error: "File size must be less than 10MB" };
    }

    // Generate unique filename
    const fileExt = file.name.split(".").pop();
    const timestamp = Date.now();
    const uniqueId = uuidv4().split('-')[0]; // Shorter unique ID
    const fileName = `${timestamp}-${uniqueId}.${fileExt}`;
    
    // Create user-specific file path
    const filePath = `${user.id}/${fileName}`;

    try {
      // Upload original file to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("muse-files")
        .upload(filePath, file, {
          upsert: false,
          cacheControl: "31536000", // 1 year cache (longer than before)
        });

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      // Parse image dimensions (provided from client-side)
      const dimensions = {
        width: imageWidth ? parseInt(imageWidth) : null,
        height: imageHeight ? parseInt(imageHeight) : null,
      };

      // Insert record into database
      const { data: insertData, error: insertError } = await supabase
        .from("muse_items")
        .insert({
          user_id: user.id,
          content: filePath, // Store the file path
          content_type: contentType,
          description: description || null,
          image_width: dimensions.width,
          image_height: dimensions.height,
        })
        .select()
        .single();

      if (insertError) {
        // If database insert fails, clean up the uploaded file
        await supabase.storage.from("muse-files").remove([filePath]);
        throw new Error(`Database insert failed: ${insertError.message}`);
      }

      revalidatePath("/museboard");

      return {
        success: true,
        data: {
          id: insertData.id,
          filePath: filePath,
          dimensions: dimensions,
        },
      };

    } catch (storageError) {
      console.error("Storage/Database error:", storageError);
      return { 
        success: false, 
        error: storageError instanceof Error ? storageError.message : "Upload failed"
      };
    }

  } catch (error) {
    console.error("Upload action error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}

/**
 * Enhanced content addition with better validation
 */
export async function addContentToMuseboardAction(
  content: string,
  contentType: "text" | "link",
  options: { description?: string; sourceUrl?: string } = {}
) {
  const supabase = createServer();

  try {
    // Check authentication
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return { success: false, error: "You must be logged in to add content" };
    }

    // Validate content
    if (!content || content.trim().length === 0) {
      return { success: false, error: "Content cannot be empty" };
    }

    // Validate content length (reasonable limits)
    if (content.length > 10000) { // 10k characters max
      return { success: false, error: "Content is too long (max 10,000 characters)" };
    }

    // For links, validate URL format
    if (contentType === "link") {
      try {
        new URL(content);
      } catch {
        return { success: false, error: "Invalid URL format" };
      }
    }

    // Insert record into database
    const { data: insertData, error: insertError } = await supabase
      .from("muse_items")
      .insert({
        user_id: user.id,
        content: content.trim(),
        content_type: contentType,
        description: options.description?.trim() || null,
        source_url: options.sourceUrl?.trim() || null,
        image_width: null, // Not applicable for text/link
        image_height: null, // Not applicable for text/link
      })
      .select()
      .single();

    if (insertError) {
      throw new Error(`Database insert failed: ${insertError.message}`);
    }

    revalidatePath("/museboard");

    return {
      success: true,
      data: {
        id: insertData.id,
        content: insertData.content,
        contentType: insertData.content_type,
      },
    };

  } catch (error) {
    console.error("Add content action error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred",
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