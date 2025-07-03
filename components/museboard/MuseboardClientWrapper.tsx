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
import PasteLinkModal from "./PasteLinkModal";
import { softDeleteMuseItems } from "@/app/(private)/museboard/actions";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import EnlargedItemView from "./EnlargedItemView";

interface MuseboardClientWrapperProps {
  initialMuseItems: MuseItem[];
  user: User;
}

export default function MuseboardClientWrapper({
  initialMuseItems,
  user,
}: MuseboardClientWrapperProps) {
  const [museItems, setMuseItems] = useState<MuseItem[]>(initialMuseItems);
  const [isPasteLinkModalOpen, setIsPasteLinkModalOpen] = useState(false);
  const supabase = createClient();
  const museboardContainerRef = useRef<HTMLDivElement>(null);

  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(
    new Set()
  );

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
  
  const handleNextItem = useCallback(() => {
    setEnlargedItemIndex((prevIndex) => {
      if (prevIndex === null || prevIndex >= museItems.length - 1) return prevIndex;
      return prevIndex + 1;
    });
  }, [museItems.length]);

  const handlePrevItem = useCallback(() => {
    setEnlargedItemIndex((prevIndex) => {
      if (prevIndex === null || prevIndex <= 0) return prevIndex;
      return prevIndex - 1;
    });
  }, []);


  const onDrop = useCallback(
    // ... (this function is unchanged)
    async (acceptedFiles: File[]) => {
      if (!acceptedFiles.length) return;
      const file = acceptedFiles[0];
      const fileExtension = file.name.split(".").pop();
      const filePath = `${user.id}/${uuidv4()}.${fileExtension}`;
      const toastId = toast.loading("Uploading image...", {
        description: file.name,
      });

      try {
        const { error: uploadError } = await supabase.storage
          .from("muse-files")
          .upload(filePath, file);
        if (uploadError) throw uploadError;

        const { data: newItem, error: insertError } = await supabase
          .from("muse_items")
          .insert({
            user_id: user.id,
            content: filePath,
            content_type: "image",
            description: file.name,
          })
          .select()
          .single();
        if (insertError) throw insertError;
        
        const newItemWithUrl = { ...newItem, signedUrl: URL.createObjectURL(file) };
        handleItemAdded(newItemWithUrl);

        toast.success("Image uploaded successfully!", { id: toastId });
      } catch (error: any) {
        console.error("Error during upload process:", error);
        toast.error("Upload failed", {
          id: toastId,
          description: error.message || "Please try again.",
        });
      }
    },
    [user.id, supabase]
  );
  
  const { getRootProps, getInputProps, isDragActive, open: openFileDialog } = useDropzone({
    onDrop,
    accept: { "image/*": [".jpeg", ".jpg", ".png", ".gif", ".webp"] },
    noClick: true,
  });

  const handleItemAdded = (newItem: MuseItem) => {
    setMuseItems((prevItems) => [newItem, ...prevItems]);
    setIsPasteLinkModalOpen(false);
  };

  const handleToggleSelect = (itemId: string) => {
    // ... (this function is unchanged)
    const newSelection = new Set(selectedItemIds);
    if (newSelection.has(itemId)) {
      newSelection.delete(itemId);
    } else {
      newSelection.add(itemId);
    }
    setSelectedItemIds(newSelection);
    if (newSelection.size === 0) {
      setIsSelectionMode(false);
    }
  };

  const handleStartSelection = (itemId: string) => {
    // ... (this function is unchanged)
    setIsSelectionMode(true);
    setSelectedItemIds(new Set([itemId]));
  };

  const handleClearSelection = () => {
    // ... (this function is unchanged)
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
      toast.error("Failed to move to trash", {
        id: toastId,
        description: result.error,
      });
      setMuseItems(originalItems);
    } else {
      toast.success("Item(s) moved to trash.", { id: toastId });
    }

    handleClearSelection();
  };


  return (
    <div
      {...getRootProps()}
      className="relative min-h-full flex-grow flex flex-col"
    >
      <input {...getInputProps()} />

      <div className="flex-grow pt-8">
        {museItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted bg-muted/20 py-20 text-center">
            {/* ... (empty state content) */}
          </div>
        ) : (
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
        )}
      </div>

      {isDragActive && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-lg">
           {/* ... (drag-active content) */}
        </div>
      )}

      {!isSelectionMode && (
        <MuseboardFAB
          onUploadClick={openFileDialog}
          onPasteLinkClick={() => setIsPasteLinkModalOpen(true)}
        />
      )}

      <AnimatePresence>
        {isSelectionMode && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 p-3 bg-zinc-900/80 backdrop-blur-md rounded-xl border border-zinc-700 shadow-2xl"
          >
             {/* ... (selection mode bar) */}
          </motion.div>
        )}
      </AnimatePresence>

      <PasteLinkModal
        isOpen={isPasteLinkModalOpen}
        onOpenChange={setIsPasteLinkModalOpen}
        onItemAdded={handleItemAdded}
        user={user}
      />
      
      {/* 🔧 MODIFIED: Prop passing is now cleaner and more powerful */}
      <AnimatePresence>
        {enlargedItemIndex !== null && (
          <EnlargedItemView
            items={museItems}
            currentIndex={enlargedItemIndex}
            onClose={() => setEnlargedItemIndex(null)}
            onNavigate={setEnlargedItemIndex}
          />
        )}
      </AnimatePresence>
    </div>
  );
}