// components/museboard/MuseboardClientWrapper.tsx

"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { User } from "@supabase/supabase-js";
import { MuseItem } from "@/app/(private)/museboard/page";
import MuseItemCard from "./MuseItemCard";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { v4 as uuidv4 } from "uuid";
import { UploadCloudIcon, XIcon, Trash2Icon } from "lucide-react";
import MuseboardFAB from "./MuseboardFAB";
import { softDeleteMuseItems } from "@/app/(private)/museboard/actions";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import MuseItemModal from "./MuseItemModal";

interface MuseboardClientWrapperProps {
  initialMuseItems: MuseItem[];
  user: User;
}

const isUrl = (text: string): boolean => {
  try {
    new URL(text);
    return text.includes('.') && text.length > 3;
  } catch (_) {
    return false;
  }
};

export default function MuseboardClientWrapper({
  initialMuseItems,
  user,
}: MuseboardClientWrapperProps) {
  const [museItems, setMuseItems] = useState<MuseItem[]>(initialMuseItems);
  const supabase = createClient();
  const museboardContainerRef = useRef<HTMLDivElement>(null);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());
  const [enlargedItemIndex, setEnlargedItemIndex] = useState<number | null>(null);

  const updateColumnCount = useCallback(() => {
    // ... (this function is unchanged)
    const el = museboardContainerRef.current;
    if (!el) return;
    el.style.width = "100%";
    el.style.marginLeft = "0";
    if (window.matchMedia("(min-width: 1280px)").matches) {
      el.style.columnCount = "5";
      el.style.width = "125%";
      el.style.marginLeft = "-12.5%";
    } else if (window.matchMedia("(min-width: 1024px)").matches) {
      el.style.columnCount = "4";
    } else if (window.matchMedia("(min-width: 640px)").matches) {
      el.style.columnCount = "3";
    } else {
      el.style.columnCount = "2";
    }
  }, []);

  useEffect(() => {
    updateColumnCount();
    window.addEventListener("resize", updateColumnCount);
    return () => window.removeEventListener("resize", updateColumnCount);
  }, [updateColumnCount]);

  const handleNavigateNext = useCallback(() => {
    if (enlargedItemIndex === null || enlargedItemIndex >= museItems.length - 1) return;
    setEnlargedItemIndex(enlargedItemIndex + 1);
  }, [enlargedItemIndex, museItems.length]);

  const handleNavigatePrev = useCallback(() => {
    if (enlargedItemIndex === null || enlargedItemIndex <= 0) return;
    setEnlargedItemIndex(enlargedItemIndex - 1);
  }, [enlargedItemIndex]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (enlargedItemIndex !== null) {
        if (e.key === "Escape") setEnlargedItemIndex(null);
        if (e.key === "ArrowRight") handleNavigateNext();
        if (e.key === "ArrowLeft") handleNavigatePrev();
      } else if (isSelectionMode && e.key === "Escape") {
        handleClearSelection();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [enlargedItemIndex, isSelectionMode, handleNavigateNext, handleNavigatePrev]);

  const handleAddItem = async (
    content: string,
    contentType: MuseItem['content_type'],
    options: { description?: string; sourceUrl?: string } = {}
  ) => {
    // ... (this function is unchanged)
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    // ... (this function is unchanged)
  }, [user.id, supabase]);
  
  useEffect(() => {
    const handlePaste = (event: ClipboardEvent) => {
      // ... (this function is unchanged)
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [onDrop]);

  const { getRootProps, getInputProps, isDragActive, open: openFileDialog } = useDropzone({
    onDrop,
    accept: { "image/*": [".jpeg", ".jpg", ".png", ".gif", ".webp"] },
    noClick: true,
    noKeyboard: true,
  });

  const handleToggleSelect = (itemId: string) => {
    const newSelection = new Set(selectedItemIds);
    if (newSelection.has(itemId)) {
      newSelection.delete(itemId);
    } else {
      newSelection.add(itemId);
    }
    
    if (newSelection.size === 0) {
      setIsSelectionMode(false);
    } else {
      setIsSelectionMode(true);
    }
    setSelectedItemIds(newSelection);
  };

  const handleStartSelection = (itemId: string) => {
    setIsSelectionMode(true);
    setSelectedItemIds(new Set([itemId]));
  };

  const handleClearSelection = () => {
    setIsSelectionMode(false);
    setSelectedItemIds(new Set());
  };

  const handleDelete = async (itemIds: string[]) => {
    // ... (this function is unchanged)
    const toastId = toast.loading(`Moving ${itemIds.length} item(s) to trash...`);
    const originalItems = [...museItems];
    const newItems = originalItems.filter((item) => !itemIds.includes(item.id));
    setMuseItems(newItems);
    const result = await softDeleteMuseItems(itemIds);
    if (result.error) {
      toast.error("Failed to move to trash", { id: toastId, description: result.error });
      setMuseItems(originalItems);
    } else {
      toast.success("Item(s) moved to trash.", { id: toastId });
    }
    handleClearSelection();
  };

  const selectedItem = enlargedItemIndex !== null ? museItems[enlargedItemIndex] : null;

  return (
    <div {...getRootProps()} className="relative min-h-full flex-grow flex flex-col focus:outline-none">
      <input {...getInputProps()} />

      <div className="flex-grow pt-8">
        {/* ... (muse items mapping is unchanged) ... */}
        {museItems.length > 0 ? (
          <div ref={museboardContainerRef} style={{ columnGap: "1rem" }}>
            {museItems.map((item, index) => (
              <MuseItemCard
                key={item.id}
                item={item}
                index={index}
                isSelectionMode={isSelectionMode}
                isSelected={selectedItemIds.has(item.id)}
                onToggleSelect={() => handleToggleSelect(item.id)}
                onStartSelection={() => handleStartSelection(item.id)}
                onDelete={() => handleDelete([item.id])}
                onEnlarge={() => setEnlargedItemIndex(index)}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted bg-muted/20 py-20 text-center">
            <h3 className="mt-4 text-lg font-semibold">Your Museboard is empty</h3>
            <p className="mt-2 mb-4 text-sm text-muted-foreground">
              Drag & drop images, paste links, or use the + button to add your first inspiration.
            </p>
          </div>
        )}
      </div>

      {isDragActive && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm rounded-lg border-2 border-dashed border-primary">
            <UploadCloudIcon className="mx-auto h-12 w-12 text-primary animate-bounce" />
            <p className="mt-4 text-lg font-medium">Drop to upload</p>
        </div>
      )}
      
      {!isSelectionMode && (
        <MuseboardFAB
          onUploadClick={openFileDialog}
          onPasteLinkClick={() => toast.info("Just paste anywhere on the page!")}
        />
      )}

      {/* ✨ RESTORED: The logic and content for the selection action bar */}
      <AnimatePresence>
        {isSelectionMode && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 p-3 bg-zinc-900/80 backdrop-blur-md rounded-xl border border-zinc-700 shadow-2xl"
          >
            <span className="text-sm font-medium text-zinc-300">
              {selectedItemIds.size} selected
            </span>

            {/* MODIFIED: Added hover effect class */}
            <Button
              variant="destructive"
              size="sm"
              onClick={() => handleDelete(Array.from(selectedItemIds))}
              className="cursor-pointer hover:scale-103 transition-transform"
            >
              <Trash2Icon className="mr-2 size-4" /> Delete
            </Button>
            
            {/* MODIFIED: Changed to an icon-only button with hover effect */}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClearSelection}
              className="text-zinc-400 hover:text-white cursor-pointer hover:scale-103 transition-transform"
            >
              <XIcon className="size-5" />
              <span className="sr-only">Cancel selection</span>
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      <MuseItemModal
        isOpen={enlargedItemIndex !== null}
        onClose={() => setEnlargedItemIndex(null)}
        item={selectedItem}
        onNavigateNext={handleNavigateNext}
        onNavigatePrev={handleNavigatePrev}
        hasNext={enlargedItemIndex !== null && enlargedItemIndex < museItems.length - 1}
        hasPrev={enlargedItemIndex !== null && enlargedItemIndex > 0}
      />
    </div>
  );
}