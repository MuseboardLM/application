// lib/actions/mission.ts

"use server";

import { createServer } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import type { MuseItem, UserMission, ShadowContext } from "@/lib/types";

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

    // Add to muse_items table with AI processing status
    const { error: dbError } = await supabase
      .from("muse_items")
      .insert({
        user_id: user.id,
        content: filePath,
        content_type: "image",
        description: "First inspiration added during onboarding",
        ai_status: "pending", // Mark for AI processing
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
    const uniqueId = uuidv4().split('-')[0];
    const fileName = `${timestamp}-${uniqueId}.${fileExt}`;
    
    // Create user-specific file path
    const filePath = `${user.id}/${fileName}`;

    try {
      // Upload original file to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("muse-files")
        .upload(filePath, file, {
          upsert: false,
          cacheControl: "31536000", // 1 year cache
        });

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      // Parse image dimensions
      const dimensions = {
        width: imageWidth ? parseInt(imageWidth) : null,
        height: imageHeight ? parseInt(imageHeight) : null,
      };

      // Insert record into database with AI processing status
      const { data: insertData, error: insertError } = await supabase
        .from("muse_items")
        .insert({
          user_id: user.id,
          content: filePath,
          content_type: contentType,
          description: description || null,
          image_width: dimensions.width,
          image_height: dimensions.height,
          ai_status: "pending", // Mark for AI processing
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
 * Enhanced content addition with AI processing
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

    if (content.length > 10000) {
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

    // Insert record into database with AI processing status
    const { data: insertData, error: insertError } = await supabase
      .from("muse_items")
      .insert({
        user_id: user.id,
        content: content.trim(),
        content_type: contentType,
        description: options.description?.trim() || null,
        source_url: options.sourceUrl?.trim() || null,
        image_width: null,
        image_height: null,
        ai_status: "pending", // Mark for AI processing
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
export async function getUserMission(): Promise<UserMission | null> {
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

/**
 * Get Shadow context for AI processing
 * This provides all the context Shadow needs to understand the user
 */
export async function getShadowContext(): Promise<ShadowContext | null> {
  const supabase = createServer();
  
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    return null;
  }

  try {
    // Get user mission
    const { data: mission } = await supabase
      .from("user_missions")
      .select("mission_statement")
      .eq("user_id", user.id)
      .single();

    if (!mission?.mission_statement) {
      return null;
    }

    // Get recent muse items (last 50 for context)
    const { data: recentItems } = await supabase
      .from("muse_items")
      .select("*")
      .eq("user_id", user.id)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(50);

    // Get total item count
    const { count: totalItems } = await supabase
      .from("muse_items")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .is("deleted_at", null);

    // Extract categories from items
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

    // Analyze user preferences
    const contentTypeCounts = (recentItems || []).reduce((acc, item) => {
      acc[item.content_type] = (acc[item.content_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const preferredContentTypes = Object.entries(contentTypeCounts)
      .sort(([,a], [,b]) => b - a)
      .map(([type]) => type);

    // Get recent conversation history (last 20 messages)
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
      
      conversationHistory = (messages || []).reverse(); // Show oldest first
    }

    return {
      mission: mission.mission_statement,
      recentItems: (recentItems || []) as MuseItem[],
      totalItems: totalItems || 0,
      topCategories,
      userPreferences: {
        contentTypes: preferredContentTypes,
        categories: topCategories,
        sources: [], // Could extract from source_url if needed
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
  const supabase = createServer();
  
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
  const supabase = createServer();
  
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
    .eq("user_id", user.id); // Ensure user can only update their own items

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/museboard");
  return { success: true };
}

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

  // Verify user owns the conversation
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

  // Try to get existing active conversation
  const { data: conversation } = await supabase
    .from("ai_conversations")
    .select("*")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .single();

  if (conversation) {
    return conversation;
  }

  // Create new conversation if none exists
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

  // Verify user owns the conversation
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

/**
 * Search muse items with AI-enhanced filtering
 */
export async function searchMuseItems(
  query: string,
  filters?: {
    categories?: string[];
    content_types?: string[];
    relevance_threshold?: number;
  }
) {
  const supabase = createServer();
  
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    return { success: false, error: "Authentication required", data: [] };
  }

  try {
    let queryBuilder = supabase
      .from("muse_items")
      .select("*")
      .eq("user_id", user.id)
      .is("deleted_at", null);

    // Add text search
    if (query.trim()) {
      queryBuilder = queryBuilder.or(`content.ilike.%${query}%,description.ilike.%${query}%,ai_summary.ilike.%${query}%`);
    }

    // Add category filter
    if (filters?.categories && filters.categories.length > 0) {
      queryBuilder = queryBuilder.overlaps("ai_categories", filters.categories);
    }

    // Add content type filter
    if (filters?.content_types && filters.content_types.length > 0) {
      queryBuilder = queryBuilder.in("content_type", filters.content_types);
    }

    // Add relevance threshold
    if (filters?.relevance_threshold !== undefined) {
      queryBuilder = queryBuilder.gte("ai_relevance_score", filters.relevance_threshold);
    }

    // Order by relevance score if available, then by creation date
    queryBuilder = queryBuilder.order("ai_relevance_score", { ascending: false, nullsFirst: false })
                              .order("created_at", { ascending: false });

    const { data: items, error } = await queryBuilder.limit(100);

    if (error) {
      return { success: false, error: error.message, data: [] };
    }

    return { success: true, data: items as MuseItem[] };

  } catch (error) {
    console.error("Search error:", error);
    return { success: false, error: "Search failed", data: [] };
  }
}