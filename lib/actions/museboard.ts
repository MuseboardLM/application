// lib/actions/museboard.ts


"use server";

import { createServer } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { redirect } from "next/navigation";

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
  const supabase = createServer();
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