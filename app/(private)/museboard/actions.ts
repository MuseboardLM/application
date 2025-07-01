// app/(private)/museboard/actions.ts

"use server";

import { createServer } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// --- EXISTING FUNCTION (NO CHANGES) ---
/**
 * Performs a "soft delete" on one or more muse items by setting their 'deleted_at' timestamp.
 */
export async function softDeleteMuseItems(
  itemIds: string[]
): Promise<{ success: boolean; error?: string }> {
  if (!itemIds || itemIds.length === 0) {
    return { success: false, error: "No items selected for deletion." };
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
      .in("id", itemIds)
      .eq("user_id", user.id);
    if (error) throw error;
    revalidatePath("/museboard");
    revalidatePath("/trash"); // Revalidate trash page as well
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// --- NEW FUNCTION ---
/**
 * Restores one or more soft-deleted muse items by setting their 'deleted_at' timestamp to null.
 */
export async function restoreMuseItems(
  itemIds: string[]
): Promise<{ success: boolean; error?: string }> {
  if (!itemIds || itemIds.length === 0) {
    return { success: false, error: "No items selected for restoration." };
  }
  const supabase = createServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Authentication required." };
  }
  try {
    const { error } = await supabase
      .from("muse_items")
      .update({ deleted_at: null }) // Set deleted_at back to NULL
      .in("id", itemIds)
      .eq("user_id", user.id);
    if (error) throw error;
    revalidatePath("/museboard"); // Revalidate the main board
    revalidatePath("/trash"); // Revalidate the trash page
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// --- NEW FUNCTION ---
/**
 * Permanently deletes muse items from the database and their associated files from storage.
 */
export async function permanentlyDeleteMuseItems(
  itemIds: string[]
): Promise<{ success: boolean; error?: string }> {
  if (!itemIds || itemIds.length === 0) {
    return { success: false, error: "No items selected for permanent deletion." };
  }
  const supabase = createServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Authentication required." };
  }

  try {
    // Step 1: Fetch the items to identify any associated storage files.
    // This is crucial to prevent orphaned files in your storage bucket.
    const { data: itemsToDelete, error: fetchError } = await supabase
      .from("muse_items")
      .select("content, content_type")
      .in("id", itemIds)
      .eq("user_id", user.id);

    if (fetchError) throw fetchError;

    // Step 2: If there are image files, delete them from Supabase Storage.
    const filePathsToDelete = itemsToDelete
      .filter(item => item.content_type === 'image' || item.content_type === 'screenshot')
      .map(item => item.content);

    if (filePathsToDelete.length > 0) {
      const { error: storageError } = await supabase.storage
        .from("muse-files")
        .remove(filePathsToDelete);
      
      if (storageError) {
        // Log the error but don't block DB deletion. It's better to have an orphaned
        // file than to prevent the user from deleting the record.
        console.error("Storage deletion failed:", storageError.message);
      }
    }

    // Step 3: Permanently delete the records from the 'muse_items' table.
    const { error: deleteError } = await supabase
      .from("muse_items")
      .delete()
      .in("id", itemIds)
      .eq("user_id", user.id);

    if (deleteError) throw deleteError;

    revalidatePath("/trash"); // Revalidate the trash page
    return { success: true };

  } catch (err: any) {
    return { success: false, error: err.message };
  }
}