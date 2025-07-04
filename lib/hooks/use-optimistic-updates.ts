"use client";

import { useOptimistic, useCallback } from "react";
import { toast } from "sonner";

export type OptimisticAction<T> = {
  type: string;
  payload: any;
  optimisticId?: string;
};

export type OptimisticReducer<T> = (state: T[], action: OptimisticAction<T>) => T[];

export interface OptimisticUpdateOptions<T> {
  onSuccess?: (data: T[]) => void;
  onError?: (error: string, originalData: T[]) => void;
  successMessage?: string;
  errorMessage?: string;
}

export function useOptimisticUpdates<T>(
  initialData: T[],
  reducer: OptimisticReducer<T>
) {
  const [optimisticData, addOptimisticUpdate] = useOptimistic(initialData, reducer);

  const performOptimisticUpdate = useCallback(
    async <R>(
      action: OptimisticAction<T>,
      serverAction: () => Promise<{ success: boolean; data?: R; error?: string }>,
      options: OptimisticUpdateOptions<T> = {}
    ) => {
      const {
        onSuccess,
        onError,
        successMessage,
        errorMessage,
      } = options;

      // Apply optimistic update immediately
      addOptimisticUpdate(action);

      try {
        const result = await serverAction();

        if (result.success) {
          if (successMessage) {
            toast.success(successMessage);
          }
          if (onSuccess) {
            onSuccess(optimisticData);
          }
          return result;
        } else {
          // Revert optimistic update by throwing error
          throw new Error(result.error || "Operation failed");
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "An unexpected error occurred";
        
        if (errorMessage) {
          toast.error(errorMessage);
        } else {
          toast.error(message);
        }
        
        if (onError) {
          onError(message, initialData);
        }
        
        // The optimistic update will be reverted automatically
        // when the component re-renders with the original data
        throw error;
      }
    },
    [addOptimisticUpdate, optimisticData, initialData]
  );

  const addOptimisticItem = useCallback((item: T, type: string = "ADD") => {
    addOptimisticUpdate({
      type,
      payload: item,
      optimisticId: `optimistic-${Date.now()}`,
    });
  }, [addOptimisticUpdate]);

  const updateOptimisticItem = useCallback((item: T, type: string = "UPDATE") => {
    addOptimisticUpdate({
      type,
      payload: item,
    });
  }, [addOptimisticUpdate]);

  const removeOptimisticItem = useCallback((itemId: string, type: string = "REMOVE") => {
    addOptimisticUpdate({
      type,
      payload: { id: itemId },
    });
  }, [addOptimisticUpdate]);

  const batchOptimisticUpdate = useCallback((items: T[], type: string = "BATCH") => {
    addOptimisticUpdate({
      type,
      payload: items,
    });
  }, [addOptimisticUpdate]);

  return {
    data: optimisticData,
    performOptimisticUpdate,
    addOptimisticItem,
    updateOptimisticItem,
    removeOptimisticItem,
    batchOptimisticUpdate,
  };
}

// Specialized hook for common CRUD operations
export function useOptimisticCRUD<T extends { id: string }>(
  initialData: T[]
) {
  const reducer: OptimisticReducer<T> = (state, action) => {
    switch (action.type) {
      case "ADD":
        return [action.payload, ...state];
      
      case "UPDATE":
        return state.map(item =>
          item.id === action.payload.id 
            ? { ...item, ...action.payload }
            : item
        );
      
      case "REMOVE":
        return state.filter(item => item.id !== action.payload.id);
      
      case "BATCH_REMOVE":
        return state.filter(item => !action.payload.ids.includes(item.id));
      
      case "BATCH_UPDATE":
        return state.map(item => {
          const update = action.payload.updates.find((u: any) => u.id === item.id);
          return update ? { ...item, ...update } : item;
        });
      
      default:
        return state;
    }
  };

  const optimistic = useOptimisticUpdates(initialData, reducer);

  const addItem = useCallback(
    async (
      item: T,
      serverAction: () => Promise<{ success: boolean; data?: T; error?: string }>,
      options?: OptimisticUpdateOptions<T>
    ) => {
      return optimistic.performOptimisticUpdate(
        { type: "ADD", payload: item },
        serverAction,
        {
          successMessage: "Item added successfully",
          errorMessage: "Failed to add item",
          ...options,
        }
      );
    },
    [optimistic]
  );

  const updateItem = useCallback(
    async (
      item: Partial<T> & { id: string },
      serverAction: () => Promise<{ success: boolean; data?: T; error?: string }>,
      options?: OptimisticUpdateOptions<T>
    ) => {
      return optimistic.performOptimisticUpdate(
        { type: "UPDATE", payload: item },
        serverAction,
        {
          successMessage: "Item updated successfully",
          errorMessage: "Failed to update item",
          ...options,
        }
      );
    },
    [optimistic]
  );

  const removeItem = useCallback(
    async (
      itemId: string,
      serverAction: () => Promise<{ success: boolean; error?: string }>,
      options?: OptimisticUpdateOptions<T>
    ) => {
      return optimistic.performOptimisticUpdate(
        { type: "REMOVE", payload: { id: itemId } },
        serverAction,
        {
          successMessage: "Item removed successfully",
          errorMessage: "Failed to remove item",
          ...options,
        }
      );
    },
    [optimistic]
  );

  const batchRemove = useCallback(
    async (
      itemIds: string[],
      serverAction: () => Promise<{ success: boolean; error?: string }>,
      options?: OptimisticUpdateOptions<T>
    ) => {
      return optimistic.performOptimisticUpdate(
        { type: "BATCH_REMOVE", payload: { ids: itemIds } },
        serverAction,
        {
          successMessage: `${itemIds.length} items removed successfully`,
          errorMessage: "Failed to remove items",
          ...options,
        }
      );
    },
    [optimistic]
  );

  return {
    data: optimistic.data,
    addItem,
    updateItem,
    removeItem,
    batchRemove,
  };
}