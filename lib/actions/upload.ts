// lib/actions/upload.ts

"use server";

import { createServer } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { v4 as uuidv4 } from "uuid";
import type { MissionResult } from "@/lib/types";

/**
 * Upload file during onboarding
 */
export async function uploadOnboardingFileAction(formData: FormData): Promise<MissionResult> {
  try {
    const supabase = await createServer();
    
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

    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${user.id}/${fileName}`;

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

    const { error: dbError } = await supabase
      .from("muse_items")
      .insert({
        user_id: user.id,
        content: filePath,
        content_type: "image",
        description: "First inspiration added during onboarding",
        ai_status: "pending",
      });

    if (dbError) {
      console.error("Database insert error:", dbError);
      
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
 * Enhanced upload action with compression and thumbnail generation
 */
export async function uploadFileToMuseboardAction(formData: FormData) {
  const supabase = await createServer();

  try {
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

    const allowedTypes = [
      "image/jpeg", "image/jpg", "image/png", "image/gif", 
      "image/webp", "image/svg+xml",
      "video/mp4", "video/webm", "video/quicktime"
    ];

    if (!allowedTypes.includes(file.type)) {
      return { success: false, error: "File type not supported" };
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return { success: false, error: "File size must be less than 10MB" };
    }

    const fileExt = file.name.split(".").pop();
    const timestamp = Date.now();
    const uniqueId = uuidv4().split('-')[0];
    const fileName = `${timestamp}-${uniqueId}.${fileExt}`;
    
    const filePath = `${user.id}/${fileName}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from("muse-files")
        .upload(filePath, file, {
          upsert: false,
          cacheControl: "31536000",
        });

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      const dimensions = {
        width: imageWidth ? parseInt(imageWidth) : null,
        height: imageHeight ? parseInt(imageHeight) : null,
      };

      const { data: insertData, error: insertError } = await supabase
        .from("muse_items")
        .insert({
          user_id: user.id,
          content: filePath,
          content_type: contentType,
          description: description || null,
          image_width: dimensions.width,
          image_height: dimensions.height,
          ai_status: "pending",
        })
        .select()
        .single();

      if (insertError) {
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