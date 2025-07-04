// lib/hooks/use-muse-items

"use client";

import { useState, useCallback, useTransition } from "react";
import { toast } from "sonner";
import { 
  softDeleteMuseItems, 
  restoreMuseItems, 
  permanentlyDeleteMuseItems 
} from "@/lib/actions";
import { useErrorHandler } from "@/lib/utils/error-handler";

export type MuseItem = {
  id: string;
  user_id: string;
  created_at: string;
  content: string | null;
  content_type: "text" | "image" | "link" | "screenshot";
  description: string | null;
  source_url: string | null;
  ai_categories: string[] | null;
  ai_clusters: string[] | null;
  deleted_at: string | null;
  signedUrl?: string;
};

interface UseMuseItemsProps {
  initialItems: MuseItem[];
  showDeleted?: boolean;
}

export function useMuseItems({ initialItems, showDeleted = false }: UseMuseItemsProps) {
  const [items, setItems] = useState<MuseItem[]>(initialItems);
  const [isPending, startTransition] = useTransition();
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const { handleError } = useErrorHandler();

  // Filter items based on showDeleted flag
  const filteredItems = items.filter(item => 
    showDeleted ? item.deleted_at !== null : item.deleted_at === null
  );

  const handleSoftDelete = useCallback(async (itemIds: string[]) => {
    if (itemIds.length === 0) return;

    // Store original items for potential rollback
    const originalItems = [...items];
    
    // Optimistically update the UI
    startTransition(() => {
      setItems(prev => prev.map(item => 
        itemIds.includes(item.id) 
          ? { ...item, deleted_at: new Date().toISOString() }
          : item
      ));
    });
    
    try {
      const result = await softDeleteMuseItems(itemIds);
      
      if (result.success) {
        toast.success(
          itemIds.length === 1 
            ? "Item moved to trash" 
            : `${itemIds.length} items moved to trash`
        );
        
        // Clear selection
        setSelectedItems([]);
      } else {
        // Revert optimistic update on error
        setItems(originalItems);
        handleError(new Error(result.error), "Soft delete items");
      }
    } catch (error) {
      // Revert optimistic update on error
      setItems(originalItems);
      handleError(error, "Soft delete items");
    }
  }, [items, handleError]);

  const handleRestore = useCallback(async (itemIds: string[]) => {
    if (itemIds.length === 0) return;

    const originalItems = [...items];
    
    // Optimistically update the UI
    startTransition(() => {
      setItems(prev => prev.map(item => 
        itemIds.includes(item.id) 
          ? { ...item, deleted_at: null }
          : item
      ));
    });
    
    try {
      const result = await restoreMuseItems(itemIds);
      
      if (result.success) {
        toast.success(
          itemIds.length === 1 
            ? "Item restored" 
            : `${itemIds.length} items restored`
        );
        
        // Clear selection
        setSelectedItems([]);
      } else {
        // Revert optimistic update on error
        setItems(originalItems);
        handleError(new Error(result.error), "Restore items");
      }
    } catch (error) {
      // Revert optimistic update on error
      setItems(originalItems);
      handleError(error, "Restore items");
    }
  }, [items, handleError]);

  const handlePermanentDelete = useCallback(async (itemIds: string[]) => {
    if (itemIds.length === 0) return;

    const originalItems = [...items];
    
    // Optimistically update the UI
    startTransition(() => {
      setItems(prev => prev.filter(item => !itemIds.includes(item.id)));
    });
    
    try {
      const result = await permanentlyDeleteMuseItems(itemIds);
      
      if (result.success) {
        toast.success(
          itemIds.length === 1 
            ? "Item permanently deleted" 
            : `${itemIds.length} items permanently deleted`
        );
        
        // Clear selection
        setSelectedItems([]);
      } else {
        // Revert optimistic update on error
        setItems(originalItems);
        handleError(new Error(result.error), "Permanently delete items");
      }
    } catch (error) {
      // Revert optimistic update on error
      setItems(originalItems);
      handleError(error, "Permanently delete items");
    }
  }, [items, handleError]);

  const addItem = useCallback((item: MuseItem) => {
    startTransition(() => {
      setItems(prev => [item, ...prev]);
    });
  }, []);

  const toggleSelectItem = useCallback((itemId: string) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  }, []);

  const selectAll = useCallback(() => {
    setSelectedItems(filteredItems.map(item => item.id));
  }, [filteredItems]);

  const clearSelection = useCallback(() => {
    setSelectedItems([]);
  }, []);

  const isSelected = useCallback((itemId: string) => {
    return selectedItems.includes(itemId);
  }, [selectedItems]);

  return {
    items: filteredItems,
    loading: isPending,
    selectedItems,
    hasSelected: selectedItems.length > 0,
    selectedCount: selectedItems.length,
    actions: {
      softDelete: handleSoftDelete,
      restore: handleRestore,
      permanentDelete: handlePermanentDelete,
      addItem,
    },
    selection: {
      toggle: toggleSelectItem,
      selectAll,
      clear: clearSelection,
      isSelected,
    },
  };
}