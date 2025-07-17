// app/(private)/museboard/actions.ts

"use server";

import { createServer } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// Reusable Zod schema to validate an array of UUIDs.
// This ensures we always receive a non-empty array of valid strings.
const UuidArraySchema = z.array(z.string().uuid()).min(1, {
  message: "At least one item must be selected.",
});

/**
 * Performs a "soft delete" on one or more muse items by setting their 'deleted_at' timestamp.
 * This moves items to a "trash" state without permanently removing them.
 * @param itemIds - An array of item UUIDs to be soft-deleted.
 * @returns A promise that resolves to an object indicating success or failure.
 */
export async function softDeleteMuseItems(
  itemIds: string[]
): Promise<{ success: boolean; error?: string }> {
  const validation = UuidArraySchema.safeParse(itemIds);
  if (!validation.success) {
    // Log the detailed validation error for server-side debugging
    console.error("Validation failed:", validation.error.flatten());
    return { success: false, error: "Invalid input provided." };
  }

  const supabase = await createServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Authentication required." };
  }

  try {
    const { error } = await supabase
      .from("muse_items")
      .update({ deleted_at: new Date().toISOString() })
      .in("id", validation.data) // Use the validated data for security
      .eq("user_id", user.id); // Critical security check

    if (error) throw error;

    // Revalidate both paths where the data might be displayed
    revalidatePath("/museboard");
    revalidatePath("/trash");

    return { success: true };
  } catch (err: any) {
    console.error("Error soft-deleting items:", err.message);
    return { success: false, error: "Could not move items to trash." };
  }
}

/**
 * Restores one or more soft-deleted muse items by setting their 'deleted_at' value to null.
 * This moves items from the "trash" back to the main museboard.
 * @param itemIds - An array of item UUIDs to be restored.
 * @returns A promise that resolves to an object indicating success or failure.
 */
export async function restoreMuseItems(
  itemIds: string[]
): Promise<{ success: boolean; error?: string }> {
  const validation = UuidArraySchema.safeParse(itemIds);
  if (!validation.success) {
    console.error("Validation failed:", validation.error.flatten());
    return { success: false, error: "Invalid input provided." };
  }

  const supabase = await createServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Authentication required." };
  }

  try {
    const { error } = await supabase
      .from("muse_items")
      .update({ deleted_at: null })
      .in("id", validation.data)
      .eq("user_id", user.id);

    if (error) throw error;

    revalidatePath("/museboard");
    revalidatePath("/trash");

    return { success: true };
  } catch (err: any) {
    console.error("Error restoring items:", err.message);
    return { success: false, error: "Could not restore items." };
  }
}

/**
 * Permanently deletes muse items from the database and their associated files from storage.
 * This action is irreversible.
 * @param itemIds - An array of item UUIDs to be permanently deleted.
 * @returns A promise that resolves to an object indicating success or failure.
 */
export async function permanentlyDeleteMuseItems(
  itemIds: string[]
): Promise<{ success: boolean; error?: string }> {
  const validation = UuidArraySchema.safeParse(itemIds);
  if (!validation.success) {
    console.error("Validation failed:", validation.error.flatten());
    return { success: false, error: "Invalid input provided." };
  }

  const supabase = await createServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Authentication required." };
  }

  try {
    // First, get the paths of any files that need to be deleted from Storage.
    const { data: itemsToDelete, error: fetchError } = await supabase
      .from("muse_items")
      .select("content, content_type")
      .in("id", validation.data)
      .eq("user_id", user.id);

    if (fetchError) throw fetchError;

    const filePathsToDelete = itemsToDelete
      .filter((item) => item.content_type === "image" || item.content_type === "screenshot")
      .map((item) => item.content);

    // Delete files from Supabase Storage if any exist.
    if (filePathsToDelete.length > 0) {
      const { error: storageError } = await supabase.storage
        .from("muse-files")
        .remove(filePathsToDelete);
      if (storageError) throw storageError;
    }

    // Finally, delete the database records.
    const { error: deleteError } = await supabase
      .from("muse_items")
      .delete()
      .in("id", validation.data)
      .eq("user_id", user.id);

    if (deleteError) throw deleteError;

    revalidatePath("/trash");

    return { success: true };
  } catch (err: any) {
    console.error("Error permanently deleting items:", err.message);
    return { success: false, error: "Could not permanently delete items." };
  }
}