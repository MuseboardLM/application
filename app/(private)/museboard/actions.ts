// app/(private)/museboard/actions.ts

"use server";

import { createServer } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { MuseItem } from "./page";

type ItemForDeletion = Pick<MuseItem, 'id' | 'content' | 'content_type'>;

// --- UPDATED: This now performs a SOFT delete ---
export async function softDeleteMuseItems(itemIds: string[]) {
  if (!itemIds || itemIds.length === 0) {
    return { error: "No item IDs provided." };
  }
  const supabase = createServer();
  try {
    const { error } = await supabase
      .from("muse_items")
      .update({ deleted_at: new Date().toISOString() }) // Set the deleted_at timestamp
      .in("id", itemIds);

    if (error) throw error;

    revalidatePath("/museboard");
    revalidatePath("/settings/trash"); // Also revalidate the trash path
    return { success: true };
  } catch (error: any) {
    console.error("Error soft deleting muse items:", error);
    return { error: error.message || "An unexpected error occurred." };
  }
}

// --- NEW: Action to restore items from the trash ---
export async function restoreMuseItems(itemIds: string[]) {
  if (!itemIds || itemIds.length === 0) {
    return { error: "No item IDs provided." };
  }
  const supabase = createServer();
  try {
    const { error } = await supabase
      .from("muse_items")
      .update({ deleted_at: null }) // Set deleted_at back to NULL
      .in("id", itemIds);

    if (error) throw error;

    revalidatePath("/museboard");
    revalidatePath("/settings/trash");
    return { success: true };
  } catch (error: any) {
    console.error("Error restoring muse items:", error);
    return { error: error.message || "An unexpected error occurred." };
  }
}

// --- NEW: Action to permanently delete items ---
export async function permanentlyDeleteMuseItems(itemIds: string[]) {
  if (!itemIds || itemIds.length === 0) {
    return { error: "No item IDs provided." };
  }
  const supabase = createServer();
  try {
    // First, get the items to identify any associated files in storage
    const { data: items, error: fetchError } = await supabase
      .from("muse_items")
      .select("id, content, content_type")
      .in("id", itemIds)
      .returns<ItemForDeletion[]>();

    if (fetchError) throw fetchError;
    if (!items) return { success: true };

    // Delete associated files from storage
    const filePathsToDelete = items
      .filter(item => item.content_type === 'image' || item.content_type === 'screenshot')
      .map(item => item.content);
    
    if (filePathsToDelete.length > 0) {
      const { error: storageError } = await supabase.storage
        .from("muse-files")
        .remove(filePathsToDelete);
      if (storageError) console.error("Storage deletion error:", storageError.message);
    }

    // Finally, permanently delete the records from the database
    const { error: dbError } = await supabase
      .from("muse_items")
      .delete()
      .in("id", itemIds);

    if (dbError) throw dbError;

    revalidatePath("/settings/trash");
    return { success: true };
  } catch (error: any) {
    console.error("Error permanently deleting muse items:", error);
    return { error: error.message || "An unexpected error occurred." };
  }
}