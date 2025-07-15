// components/museboard/MuseboardClientWrapper.tsx

"use client";

import { useState, useCallback, useRef, useEffect, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import { User } from "@supabase/supabase-js";
import { MuseItem } from "@/lib/types";
import MuseItemCard from "./MuseItemCard";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import { UploadCloudIcon, XIcon, Trash2Icon } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import MuseItemModal from "./MuseItemModal";
import { uploadFileToMuseboardAction, addContentToMuseboardAction } from "@/lib/actions/mission";
import { softDeleteMuseItems } from "@/lib/actions/museboard";
import { searchMuseboardAction } from "@/lib/actions/shadow";
import { compressImage, getImageDimensions, supportsCompression, getCompressionRatio } from "@/lib/utils/image-compression";
import eventBus from "@/lib/utils/event-bus";
import MagicBar from "@/components/ai/MagicBar";
import ShadowChatModal from "@/components/ai/ShadowChatModal";

interface MuseboardClientWrapperProps {
  initialMuseItems: MuseItem[];
  user: User;
}

// Defines the shape of a search result object
interface SearchResult {
  query: string;
  answer: string;
  sources: MuseItem[];
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
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // State for existing functionality
  const museItems = initialMuseItems;
  const museboardContainerRef = useRef<HTMLDivElement>(null);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());
  const [enlargedItemIndex, setEnlargedItemIndex] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // State for the chat modal (both regular chat and search)
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);
  const [chatInitialMessage, setChatInitialMessage] = useState("");
  const [chatInitialAttachments, setChatInitialAttachments] = useState<File[]>([]);
  
  // New, dedicated state for search results
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);

  const recentContext = useMemo(() => {
    return initialMuseItems ? initialMuseItems.slice(0, 10) : [];
  }, [initialMuseItems]);

  // Refactored search handler for a cleaner data flow
  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) return;

    const toastId = toast.loading(`Searching for "${query}"...`);

    startTransition(async () => {
      const result = await searchMuseboardAction(query);
      
      if (result.success && result.data) {
        toast.success("Found results!", { id: toastId });
        // Set the entire result object in state
        setSearchResult({
          query: query,
          answer: result.data.answer,
          sources: result.data.sources,
        });
        // Open the modal. The modal will now use the searchResult state.
        setIsChatModalOpen(true); 
      } else {
        toast.error(result.error || "Search failed. Please try again.", { id: toastId });
      }
    });
  }, []);

  // This function now only handles opening the chat for non-search purposes
  const handleTransformToChat = useCallback((initialMessage: string, attachments?: File[]) => {
    setSearchResult(null); // Ensure we're not in a search state
    setChatInitialMessage(initialMessage);
    setChatInitialAttachments(attachments || []);
    setIsChatModalOpen(true);
  }, []);

  const handleCloseChatModal = useCallback(() => {
    setIsChatModalOpen(false);
    // Reset all initial chat states on close
    setChatInitialMessage("");
    setChatInitialAttachments([]);
    setSearchResult(null);
  }, []);

  // --- All other hooks and handlers remain the same ---
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

  const handleFileUpload = useCallback(async (file: File) => {
    setIsUploading(true);
    setUploadProgress(0);
    try {
      const originalSize = file.size;
      let imageDimensions = { width: 500, height: 500 };
      let processedFile = file;

      if (file.type.startsWith('image/')) {
        try {
          imageDimensions = await getImageDimensions(file);
          setUploadProgress(20);
          if (supportsCompression(file)) {
            processedFile = await compressImage(file, { maxSizeMB: 1.2, maxWidthOrHeight: 1920, quality: 0.9 });
            const compressionRatio = getCompressionRatio(originalSize, processedFile.size);
            if (compressionRatio > 10) toast.success(`Image compressed by ${compressionRatio}%`);
            setUploadProgress(60);
          }
        } catch(e) { console.warn("Could not process image", e) }
      }

      const formData = new FormData();
      formData.append("file", processedFile);
      formData.append("contentType", "image");
      formData.append("description", "Uploaded from museboard");
      formData.append("imageWidth", imageDimensions.width.toString());
      formData.append("imageHeight", imageDimensions.height.toString());

      setUploadProgress(80);
      const result = await uploadFileToMuseboardAction(formData);

      if (result.success) {
        toast.success("File uploaded successfully!");
        router.refresh();
      } else {
        toast.error(result.error || "Failed to upload file");
      }
    } catch (error) {
      toast.error("Failed to upload file");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, [router]);

  const handleAddContent = useCallback(async (content: string, contentType: "text" | "link") => {
    const result = await addContentToMuseboardAction(content, contentType);
    if (result.success) {
      toast.success(`${contentType === "link" ? "Link" : "Text"} added successfully!`);
      router.refresh();
    } else {
      toast.error(result.error || `Failed to add ${contentType}`);
    }
  }, [router]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    toast.info(`Uploading ${acceptedFiles.length} file(s)...`);
    for (const file of acceptedFiles) {
      await handleFileUpload(file);
    }
  }, [handleFileUpload]);

  useEffect(() => {
    const handlePaste = (event: ClipboardEvent) => {
      const items = event.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) handleFileUpload(file);
        } else if (item.type === 'text/plain') {
          item.getAsString((text) => {
            if (text.trim()) {
              if (isUrl(text)) handleAddContent(text, 'link');
              else handleAddContent(text, 'text');
            }
          });
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [handleFileUpload, handleAddContent]);

  const { getRootProps, getInputProps, isDragActive, open: openFileDialog } = useDropzone({
    onDrop,
    accept: { "image/*": [".jpeg", ".jpg", ".png", ".gif", ".webp", ".svg"] },
    noClick: true,
    noKeyboard: true,
  });

  useEffect(() => {
    const handler = () => {
      openFileDialog();
    };
    eventBus.on('open-add-file-dialog', handler);
    return () => {
      eventBus.off('open-add-file-dialog', handler);
    };
  }, [openFileDialog]);

  const handleToggleSelect = (itemId: string) => {
    const newSelection = new Set(selectedItemIds);
    if (newSelection.has(itemId)) newSelection.delete(itemId);
    else newSelection.add(itemId);
    setIsSelectionMode(newSelection.size > 0);
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
    const result = await softDeleteMuseItems(itemIds);
    if (result.success) {
      toast.success(`${itemIds.length} item(s) moved to trash.`);
      router.refresh();
    } else {
      toast.error(result.error || "Failed to delete items.");
    }
    handleClearSelection();
  };

  const handleMagicBarFileUpload = useCallback(async (files: File[]) => {
    for (const file of files) {
      await handleFileUpload(file);
    }
  }, [handleFileUpload]);

  const selectedItem = enlargedItemIndex !== null ? museItems[enlargedItemIndex] : null;

  return (
    <>
      <ShadowChatModal
        isOpen={isChatModalOpen}
        onClose={handleCloseChatModal}
        // Pass the correct initial state depending on whether it's a search or regular chat
        initialMessage={searchResult ? searchResult.query : chatInitialMessage}
        initialAttachments={chatInitialAttachments}
        initialAnswer={searchResult ? searchResult.answer : undefined}
        initialSources={searchResult ? searchResult.sources : undefined}
        userMission="Your mission statement"
        recentContext={recentContext}
      />

      <div {...getRootProps()} className="relative min-h-full flex-grow flex flex-col focus:outline-none p-4 sm:p-6 md:p-8">
        <input {...getInputProps()} />
        
        <div className="flex-grow pb-32">
          {museItems.length > 0 ? (
            <div ref={museboardContainerRef} style={{ columnGap: "1.5rem" }}>
              {museItems.map((item, index) => (
                <MuseItemCard
                  key={item.id} item={item}
                  isSelectionMode={isSelectionMode} isSelected={selectedItemIds.has(item.id)}
                  onToggleSelect={() => handleToggleSelect(item.id)}
                  onStartSelection={() => handleStartSelection(item.id)}
                  onDelete={() => handleDelete([item.id])}
                  onEnlarge={() => setEnlargedItemIndex(index)}
                />
              ))}
            </div>
          ) : (
            <div className="flex h-full min-h-[50vh] flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted bg-muted/20 py-20 text-center">
              <h3 className="mt-4 text-lg font-semibold">Your Museboard is empty</h3>
              <p className="mt-2 mb-4 text-sm text-muted-foreground">
                Drop files here, or use the controls in the header to add your first inspiration.
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

        <AnimatePresence>
          {isSelectionMode && (
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 p-3 bg-zinc-900/80 backdrop-blur-md rounded-xl border border-zinc-700 shadow-2xl"
            >
              <span className="text-sm font-medium text-zinc-300">{selectedItemIds.size} selected</span>
              <Button variant="destructive" size="sm" onClick={() => handleDelete(Array.from(selectedItemIds))}>
                <Trash2Icon className="mr-2 size-4" /> Delete
              </Button>
              <Button variant="ghost" size="icon" onClick={handleClearSelection} className="text-zinc-400 hover:text-white">
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

        {isUploading && (
          <div className="fixed bottom-24 right-4 bg-background border rounded-lg p-4 shadow-lg z-40 min-w-[200px]">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <div className="flex-1">
                <div className="text-sm font-medium">Uploading...</div>
                <div className="w-full bg-zinc-700 rounded-full h-1.5 mt-1">
                  <div className="bg-primary h-1.5 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                </div>
              </div>
            </div>
          </div>
        )}
        <MagicBar
          onTransformToChat={handleTransformToChat}
          onAddContent={handleAddContent}
          onFileUpload={handleMagicBarFileUpload}
          onSearch={handleSearch}
          disabled={isSelectionMode || isUploading || isPending}
        />
      </div>
    </>
  );
}