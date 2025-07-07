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
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import MuseItemModal from "./MuseItemModal";
import { useMuseItems } from "@/lib/hooks/use-muse-items";
import { uploadFileToMuseboardAction, addContentToMuseboardAction } from "@/lib/actions/mission";

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

// Helper function to get image dimensions from a file
const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };
    
    img.src = url;
  });
};

export default function MuseboardClientWrapper({
  initialMuseItems,
  user,
}: MuseboardClientWrapperProps) {
  // Use the new custom hooks
  const {
    items: museItems,
    loading,
    actions,
    selection,
  } = useMuseItems({ initialItems: initialMuseItems });

  const museboardContainerRef = useRef<HTMLDivElement>(null);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());
  const [enlargedItemIndex, setEnlargedItemIndex] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const supabase = createClient();

  const updateColumnCount = useCallback(() => {
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

  // Handle file uploads using server action
  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    
    try {
      // Get image dimensions first for proper display
      let imageDimensions = { width: 500, height: 500 }; // defaults
      
      try {
        if (file.type.startsWith('image/')) {
          imageDimensions = await getImageDimensions(file);
        }
      } catch (error) {
        console.warn('Could not get image dimensions, using defaults:', error);
      }

      const formData = new FormData();
      formData.append("file", file);
      formData.append("contentType", "image");
      formData.append("description", "Uploaded from museboard");

      const result = await uploadFileToMuseboardAction(formData);

      if (result.success && result.data) {
        // Generate a signed URL for immediate display
        const { data: signedUrlData, error: signedUrlError } = await supabase.storage
          .from("muse-files")
          .createSignedUrl(result.data.filePath, 60 * 5); // 5 minutes

        if (signedUrlError) {
          console.error("Error creating signed URL:", signedUrlError);
          toast.error("File uploaded but failed to display. Please refresh the page.");
          return;
        }

        toast.success("File uploaded successfully!");
        
        // Optimistically add the item to the UI with proper signed URL
        const newItem: MuseItem = {
          id: uuidv4(),
          user_id: user.id,
          created_at: new Date().toISOString(),
          content: result.data.filePath,
          content_type: "image",
          description: "Uploaded from museboard",
          source_url: null,
          ai_categories: null,
          ai_clusters: null,
          deleted_at: null,
          image_width: imageDimensions.width,
          image_height: imageDimensions.height,
          signedUrl: signedUrlData.signedUrl, // Use the signed URL, not public URL
        };
        
        actions.addItem(newItem);
      } else {
        toast.error(result.error || "Failed to upload file");
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload file");
    } finally {
      setIsUploading(false);
    }
  };

  // Handle text/link content using server action
  const handleAddContent = async (
    content: string,
    contentType: "text" | "link",
    options: { description?: string; sourceUrl?: string } = {}
  ) => {
    try {
      const result = await addContentToMuseboardAction(content, contentType, options);

      if (result.success) {
        toast.success(`${contentType === "link" ? "Link" : "Text"} added successfully!`);
        
        // Optimistically add the item to the UI
        const newItem: MuseItem = {
          id: uuidv4(),
          user_id: user.id,
          created_at: new Date().toISOString(),
          content,
          content_type: contentType,
          description: options.description || null,
          source_url: options.sourceUrl || null,
          ai_categories: null,
          ai_clusters: null,
          deleted_at: null,
          image_width: null, // Not applicable for text/link
          image_height: null, // Not applicable for text/link
        };
        
        actions.addItem(newItem);
      } else {
        toast.error(result.error || `Failed to add ${contentType}`);
      }
    } catch (error) {
      console.error("Add content error:", error);
      toast.error(`Failed to add ${contentType}`);
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    for (const file of acceptedFiles) {
      await handleFileUpload(file);
    }
  }, []);
  
  useEffect(() => {
    const handlePaste = (event: ClipboardEvent) => {
      if (event.clipboardData) {
        const items = event.clipboardData.items;
        
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          
          if (item.type.startsWith('image/')) {
            // Handle pasted images
            const file = item.getAsFile();
            if (file) {
              handleFileUpload(file);
            }
          } else if (item.type === 'text/plain') {
            // Handle pasted text/links
            item.getAsString((text) => {
              if (text.trim()) {
                if (isUrl(text)) {
                  handleAddContent(text, 'link', { sourceUrl: text });
                } else {
                  handleAddContent(text, 'text');
                }
              }
            });
          }
        }
      }
    };
    
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  const { getRootProps, getInputProps, isDragActive, open: openFileDialog } = useDropzone({
    onDrop,
    accept: { 
      "image/*": [".jpeg", ".jpg", ".png", ".gif", ".webp", ".svg"],
      // Add video support for future
      "video/*": [".mp4", ".webm", ".mov"]
    },
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
    // Use the optimistic update from the hook
    await actions.softDelete(itemIds);
    handleClearSelection();
  };

  const selectedItem = enlargedItemIndex !== null ? museItems[enlargedItemIndex] : null;

  return (
    <div {...getRootProps()} className="relative min-h-full flex-grow flex flex-col focus:outline-none">
      <input {...getInputProps()} />

      <div className="flex-grow pt-8">
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

      {/* Selection action bar */}
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

            <Button
              variant="destructive"
              size="sm"
              onClick={() => handleDelete(Array.from(selectedItemIds))}
              className="cursor-pointer hover:scale-103 transition-transform"
              disabled={loading}
            >
              <Trash2Icon className="mr-2 size-4" /> Delete
            </Button>
            
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

      {/* Upload Progress Indicator */}
      {isUploading && (
        <div className="fixed bottom-4 right-4 bg-background border rounded-lg p-4 shadow-lg z-40">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-sm">Uploading...</span>
          </div>
        </div>
      )}
    </div>
  );
}