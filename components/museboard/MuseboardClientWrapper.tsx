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
import { UploadCloudIcon, XIcon, Trash2Icon, LinkIcon, FileTextIcon } from "lucide-react";
import MuseboardFAB from "./MuseboardFAB";
import { softDeleteMuseItems } from "@/app/(private)/museboard/actions";
import { AnimatePresence, motion } from "framer-motion";
import MuseItemModal from "./MuseItemModal";

interface MuseboardClientWrapperProps {
  initialMuseItems: MuseItem[];
  user: User;
}

// ✨ NEW: Helper function to check for URLs
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
      if (enlargedItemIndex === null) return;
      if (e.key === "Escape") setEnlargedItemIndex(null);
      if (e.key === "ArrowRight") handleNavigateNext();
      if (e.key === "ArrowLeft") handleNavigatePrev();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [enlargedItemIndex, handleNavigateNext, handleNavigatePrev]);


  // ✨ NEW: A single, smart function to handle adding any new item
  const handleAddItem = async (
    content: string,
    contentType: MuseItem['content_type'],
    options: { description?: string; sourceUrl?: string } = {}
  ) => {
    const toastId = toast.loading(`Adding new ${contentType}...`);

    try {
      // 1. Insert the item into the database
      const { data: newItem, error: insertError } = await supabase
        .from("muse_items")
        .insert({
          user_id: user.id,
          content: content,
          content_type: contentType,
          description: options.description || null,
          source_url: options.sourceUrl || null,
        })
        .select()
        .single();

      if (insertError) throw insertError;
      
      // 2. If it's an image, call the Edge Function to get dimensions
      if (contentType === 'image' || contentType === 'screenshot') {
         try {
            const { error: functionError } = await supabase.functions.invoke('get-image-dimensions', {
              body: { key: content }, // 'content' is the file path for images
            });
            if (functionError) throw functionError;
         } catch (e: any) {
             console.error("Error invoking get-image-dimensions function:", e);
             toast.warning("Could not process image dimensions.", { id: toastId });
         }
      }

      // 3. Add the new item to the local state for a fast UI update
      // For images, we need a signed URL to display it immediately
      let newItemWithUrl = { ...newItem, signedUrl: '' };
      if (contentType === 'image' || contentType === 'screenshot') {
         const { data: signedUrlData } = await supabase.storage.from('muse-files').createSignedUrl(newItem.content, 60 * 5)
         newItemWithUrl.signedUrl = signedUrlData?.signedUrl ?? '';
      }
      setMuseItems((prevItems) => [newItemWithUrl, ...prevItems]);

      toast.success("Item added successfully!", { id: toastId });

    } catch (error: any) {
      console.error("Error adding item:", error);
      toast.error("Failed to add item", {
        id: toastId,
        description: error.message || "Please try again.",
      });
    }
  };

  // ⬇️ MODIFIED: `onDrop` is now much simpler and uses the new handler
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
      if (!acceptedFiles.length) return;
      
      const file = acceptedFiles[0];
      const toastId = toast.loading("Uploading image...", { description: file.name });
      
      try {
        const fileExtension = file.name.split(".").pop();
        const filePath = `${user.id}/${uuidv4()}.${fileExtension}`;
        
        const { error: uploadError } = await supabase.storage
          .from("muse-files")
          .upload(filePath, file);
        
        if (uploadError) throw uploadError;

        toast.dismiss(toastId); // Dismiss the "uploading" toast
        
        // Use our new unified handler to add the item
        await handleAddItem(filePath, 'image', { description: file.name });

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
  
  // ✨ NEW: Add a paste handler for automatic type detection
  useEffect(() => {
    const handlePaste = (event: ClipboardEvent) => {
      const items = event.clipboardData?.items;
      if (!items) return;

      // Check for pasted files (e.g., screenshots)
      const file = Array.from(items).find(item => item.kind === 'file');
      if (file) {
        const blob = file.getAsFile();
        if (blob) {
          onDrop([blob]); // Use the same onDrop logic for pasted files
        }
        return;
      }
      
      // Check for pasted text
      const text = Array.from(items).find(item => item.kind === 'string');
      if (text) {
        text.getAsString(pastedText => {
          if (isUrl(pastedText)) {
            handleAddItem(pastedText, 'link');
          } else {
            handleAddItem(pastedText, 'text');
          }
        });
      }
    };
    
    window.addEventListener('paste', handlePaste);
    return () => {
      window.removeEventListener('paste', handlePaste);
    };
  }, [onDrop]);


  const { getRootProps, getInputProps, isDragActive, open: openFileDialog } = useDropzone({
    onDrop,
    accept: { "image/*": [".jpeg", ".jpg", ".png", ".gif", ".webp"] },
    noClick: true,
    noKeyboard: true,
  });

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
        {museItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted bg-muted/20 py-20 text-center">
            <h3 className="mt-4 text-lg font-semibold">Your Museboard is empty</h3>
            <p className="mt-2 mb-4 text-sm text-muted-foreground">
              Drag & drop images, paste links, or use the + button to add your first inspiration.
            </p>
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
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm rounded-lg border-2 border-dashed border-primary">
            <UploadCloudIcon className="mx-auto h-12 w-12 text-primary animate-bounce" />
            <p className="mt-4 text-lg font-medium">Drop to upload</p>
        </div>
      )}
      
      {/* Remove PasteLinkModal since we now have a smart paste handler */}
      {/* <PasteLinkModal ... /> */}
      
      {/* The FAB is no longer needed if we have paste and drop, but keeping it for now */}
      {!isSelectionMode && (
        <MuseboardFAB
          onUploadClick={openFileDialog}
          onPasteLinkClick={() => toast.info("Just paste anywhere on the page!")}
        />
      )}

      <AnimatePresence>
        {isSelectionMode && (
          <motion.div /* ... selection bar ... */ >
              {/* ... same content as before ... */}
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