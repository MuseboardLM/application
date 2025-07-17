// lib/actions/museboard.ts

"use server";

import { createServer } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { redirect } from "next/navigation";
import type { MuseItem, MuseItemSort } from "@/lib/types";

// Reusable Zod schemas
const UuidArraySchema = z.array(z.string().uuid()).min(1, {
  message: "At least one item must be selected.",
});

const MuseItemSchema = z.object({
  content: z.string().nullable(),
  content_type: z.enum(["text", "image", "link", "screenshot"]),
  description: z.string().nullable(),
  source_url: z.string().url().nullable(),
  ai_categories: z.array(z.string()).nullable(),
  ai_clusters: z.array(z.string()).nullable(),
});

// Types for better type safety
export type MuseItemInput = z.infer<typeof MuseItemSchema>;
export type ActionResult<T = void> = {
  success: boolean;
  data?: T;
  error?: string;
};

/**
 * Helper function to get authenticated user
 */
async function getAuthenticatedUser() {
  const supabase = await createServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  return { user, supabase };
}

/**
 * Helper function to handle common error scenarios
 */
function handleActionError(error: unknown, defaultMessage: string): ActionResult {
  console.error(defaultMessage, error);
  
  if (error instanceof Error) {
    return { success: false, error: error.message };
  }
  
  return { success: false, error: defaultMessage };
}

/**
 * Creates a new muse item
 */
export async function createMuseItem(input: MuseItemInput): Promise<ActionResult<{ id: string }>> {
  const validation = MuseItemSchema.safeParse(input);
  if (!validation.success) {
    return { success: false, error: "Invalid input provided." };
  }

  try {
    const { user, supabase } = await getAuthenticatedUser();

    const { data, error } = await supabase
      .from("muse_items")
      .insert([
        {
          ...validation.data,
          user_id: user.id,
        },
      ])
      .select("id")
      .single();

    if (error) throw error;

    revalidatePath("/museboard");
    return { success: true, data: { id: data.id } };
  } catch (error) {
    return handleActionError(error, "Failed to create muse item.");
  }
}

/**
 * Updates an existing muse item
 */
export async function updateMuseItem(
  id: string,
  input: Partial<MuseItemInput>
): Promise<ActionResult> {
  const idValidation = z.string().uuid().safeParse(id);
  if (!idValidation.success) {
    return { success: false, error: "Invalid item ID." };
  }

  try {
    const { user, supabase } = await getAuthenticatedUser();

    const { error } = await supabase
      .from("muse_items")
      .update(input)
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) throw error;

    revalidatePath("/museboard");
    return { success: true };
  } catch (error) {
    return handleActionError(error, "Failed to update muse item.");
  }
}

/**
 * Soft deletes muse items by setting deleted_at timestamp
 */
export async function softDeleteMuseItems(itemIds: string[]): Promise<ActionResult> {
  const validation = UuidArraySchema.safeParse(itemIds);
  if (!validation.success) {
    return { success: false, error: "Invalid input provided." };
  }

  try {
    const { user, supabase } = await getAuthenticatedUser();

    const { error } = await supabase
      .from("muse_items")
      .update({ deleted_at: new Date().toISOString() })
      .in("id", validation.data)
      .eq("user_id", user.id);

    if (error) throw error;

    revalidatePath("/museboard");
    revalidatePath("/trash");

    return { success: true };
  } catch (error) {
    return handleActionError(error, "Could not move items to trash.");
  }
}

/**
 * Restores soft-deleted muse items
 */
export async function restoreMuseItems(itemIds: string[]): Promise<ActionResult> {
  const validation = UuidArraySchema.safeParse(itemIds);
  if (!validation.success) {
    return { success: false, error: "Invalid input provided." };
  }

  try {
    const { user, supabase } = await getAuthenticatedUser();

    const { error } = await supabase
      .from("muse_items")
      .update({ deleted_at: null })
      .in("id", validation.data)
      .eq("user_id", user.id);

    if (error) throw error;

    revalidatePath("/museboard");
    revalidatePath("/trash");

    return { success: true };
  } catch (error) {
    return handleActionError(error, "Could not restore items.");
  }
}

/**
 * Permanently deletes muse items and their associated files
 */
export async function permanentlyDeleteMuseItems(itemIds: string[]): Promise<ActionResult> {
  const validation = UuidArraySchema.safeParse(itemIds);
  if (!validation.success) {
    return { success: false, error: "Invalid input provided." };
  }

  try {
    const { user, supabase } = await getAuthenticatedUser();

    // First, get the items to delete and their file paths
    const { data: itemsToDelete, error: fetchError } = await supabase
      .from("muse_items")
      .select("content, content_type")
      .in("id", validation.data)
      .eq("user_id", user.id);

    if (fetchError) throw fetchError;

    const filePathsToDelete = itemsToDelete
      .filter((item) => item.content_type === "image" || item.content_type === "screenshot")
      .map((item) => item.content)
      .filter(Boolean);

    // Delete files from storage if any exist
    if (filePathsToDelete.length > 0) {
      const { error: storageError } = await supabase.storage
        .from("muse-files")
        .remove(filePathsToDelete);
      
      if (storageError) throw storageError;
    }

    // Delete the database records
    const { error: deleteError } = await supabase
      .from("muse_items")
      .delete()
      .in("id", validation.data)
      .eq("user_id", user.id);

    if (deleteError) throw deleteError;

    revalidatePath("/trash");
    return { success: true };
  } catch (error) {
    return handleActionError(error, "Could not permanently delete items.");
  }
}

/**
 * Gets all muse items for the authenticated user
 */
export async function getMuseItems(includeDeleted: boolean = false): Promise<ActionResult<any[]>> {
  try {
    const { user, supabase } = await getAuthenticatedUser();

    let query = supabase
      .from("muse_items")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (!includeDeleted) {
      query = query.is("deleted_at", null);
    }

    const { data, error } = await query;

    if (error) throw error;

    return { success: true, data: data || [] };
  } catch (error) {
    return handleActionError(error, "Failed to fetch muse items.");
  }
}

/**
 * Gets a single muse item by ID
 */
export async function getMuseItem(id: string): Promise<ActionResult<any>> {
  const validation = z.string().uuid().safeParse(id);
  if (!validation.success) {
    return { success: false, error: "Invalid item ID." };
  }

  try {
    const { user, supabase } = await getAuthenticatedUser();

    const { data, error } = await supabase
      .from("muse_items")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    return handleActionError(error, "Failed to fetch muse item.");
  }
}

// ============================================================================
// MIGRATED FUNCTIONS FROM mission.ts - Content Addition & Search
// ============================================================================

/**
 * Enhanced content addition with AI processing
 */
export async function addContentToMuseboardAction(
  content: string,
  contentType: "text" | "link",
  options: { description?: string; sourceUrl?: string } = {}
) {
  const supabase = await createServer();

  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return { success: false, error: "You must be logged in to add content" };
    }

    if (!content || content.trim().length === 0) {
      return { success: false, error: "Content cannot be empty" };
    }

    if (content.length > 10000) {
      return { success: false, error: "Content is too long (max 10,000 characters)" };
    }

    if (contentType === "link") {
      try {
        new URL(content);
      } catch {
        return { success: false, error: "Invalid URL format" };
      }
    }

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
        ai_status: "pending",
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
 * Search muse items with AI-enhanced filtering and dynamic sorting
 */
export async function searchMuseItems(
  query: string,
  options?: {
    filters?: {
      categories?: string[];
      content_types?: string[];
      relevance_threshold?: number;
    };
    sort?: MuseItemSort;
  }
) {
  const supabase = await createServer();
  
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

    // Add text search using Full-Text Search for better performance and relevance
    if (query.trim()) {
      const keywords = query.trim().split(' ').filter(Boolean).join(' & ');
      queryBuilder = queryBuilder.textSearch('fts', keywords, { type: 'websearch' });
    }

    const filters = options?.filters;
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

    // Add dynamic sorting
    const sort = options?.sort;
    if (sort && sort.field && sort.direction) {
        // For relevance, we add a secondary sort by creation date for tie-breaking
        if(sort.field === 'ai_relevance_score') {
            // Nulls are considered lowest, so for 'desc', they should come last.
            queryBuilder = queryBuilder.order(sort.field, { ascending: sort.direction === 'asc', nullsFirst: true });
            queryBuilder = queryBuilder.order('created_at', { ascending: false });
        } else {
            queryBuilder = queryBuilder.order(sort.field, { ascending: sort.direction === 'asc' });
        }
    } else {
      // Default sort
      queryBuilder = queryBuilder.order("created_at", { ascending: false });
    }

    const { data: items, error } = await queryBuilder.limit(100);

    if (error) {
      console.error("Search/Sort Error:", error.message);
      return { success: false, error: "Failed to retrieve items. " + error.message, data: [] };
    }

    return { success: true, data: items as MuseItem[] };

  } catch (error) {
    console.error("Search action error:", error);
    return { success: false, error: "An unexpected error occurred during search.", data: [] };
  }
}