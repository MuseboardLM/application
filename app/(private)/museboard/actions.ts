// app/(private)/museboard/actions.ts

"use server";

import { createServer } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod"; // --- Step 1: Import Zod

// --- Step 2: Define a reusable schema for input validation ---
// This schema ensures we receive an array containing at least one valid UUID string.
const UuidArraySchema = z.array(z.string().uuid()).min(1, {
  message: "At least one item must be selected.",
});


/**
 * Performs a "soft delete" on one or more muse items by setting their 'deleted_at' timestamp.
 */
export async function softDeleteMuseItems(
  itemIds: string[]
): Promise<{ success: boolean; error?: string }> {
  // --- Step 3: Validate the input at the start of the function ---
  const validation = UuidArraySchema.safeParse(itemIds);
  if (!validation.success) {
    return { success: false, error: "Invalid input provided." };
  }

  const supabase = createServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Authentication required." };
  }
  try {
    const { error } = await supabase
      .from("muse_items")
      .update({ deleted_at: new Date().toISOString() })
      .in("id", validation.data) // --- Step 4: Use the validated data
      .eq("user_id", user.id);

    if (error) throw error;

    revalidatePath("/museboard");
    revalidatePath("/trash");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Restores one or more soft-deleted muse items by setting their 'deleted_at' timestamp to null.
 */
export async function restoreMuseItems(
  itemIds: string[]
): Promise<{ success: boolean; error?: string }> {
  const validation = UuidArraySchema.safeParse(itemIds);
  if (!validation.success) {
    return { success: false, error: "Invalid input provided." };
  }

  const supabase = createServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Authentication required." };
  }
  try {
    const { error } = await supabase
      .from("muse_items")
      .update({ deleted_at: null })
      .in("id", validation.data) // Use the validated data
      .eq("user_id", user.id);

    if (error) throw error;

    revalidatePath("/museboard");
    revalidatePath("/trash");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Permanently deletes muse items from the database and their associated files from storage.
 */
export async function permanentlyDeleteMuseItems(
  itemIds: string[]
): Promise<{ success: boolean; error?: string }> {
  const validation = UuidArraySchema.safeParse(itemIds);
  if (!validation.success) {
    return { success: false, error: "Invalid input provided." };
  }

  const supabase = createServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Authentication required." };
  }

  try {
    const { data: itemsToDelete, error: fetchError } = await supabase
      .from("muse_items")
      .select("content, content_type")
      .in("id", validation.data) // Use the validated data
      .eq("user_id", user.id);

    if (fetchError) throw fetchError;

    const filePathsToDelete = itemsToDelete
      .filter(item => item.content_type === 'image' || item.content_type === 'screenshot')
      .map(item => item.content);

    if (filePathsToDelete.length > 0) {
      await supabase.storage
        .from("muse-files")
        .remove(filePathsToDelete);
    }
    
    const { error: deleteError } = await supabase
      .from("muse_items")
      .delete()
      .in("id", validation.data) // Use the validated data
      .eq("user_id", user.id);

    if (deleteError) throw deleteError;

    revalidatePath("/trash");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}