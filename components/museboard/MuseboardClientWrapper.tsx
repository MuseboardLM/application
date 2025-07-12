// components/museboard/MuseboardClientWrapper.tsx

"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { User } from "@supabase/supabase-js";
import { MuseItem } from "@/lib/types";
import MuseItemCard from "./MuseItemCard";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { v4 as uuidv4 } from "uuid";
import { UploadCloudIcon, XIcon, Trash2Icon } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import MuseItemModal from "./MuseItemModal";
import { useMuseItems } from "@/lib/hooks/use-muse-items";
import { uploadFileToMuseboardAction, addContentToMuseboardAction } from "@/lib/actions/mission";
import {
    compressImage,
    getImageDimensions,
    supportsCompression,
    formatFileSize,
    getCompressionRatio
} from "@/lib/utils/image-compression";
import MagicBar from "@/components/ai/MagicBar";
import ShadowChatModal from "@/components/ai/ShadowChatModal"; // Changed import

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
    const {
        items: museItems,
        loading,
        actions,
    } = useMuseItems({ initialItems: initialMuseItems });

    const museboardContainerRef = useRef<HTMLDivElement>(null);
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());
    const [enlargedItemIndex, setEnlargedItemIndex] = useState<number | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    
    // Chat modal states - much simpler now!
    const [isChatModalOpen, setIsChatModalOpen] = useState(false);
    const [chatInitialMessage, setChatInitialMessage] = useState("");
    const [chatInitialAttachments, setChatInitialAttachments] = useState<File[]>([]);

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

    const handleFileUpload = async (file: File) => {
        setIsUploading(true);
        setUploadProgress(0);

        try {
            const originalSize = file.size;
            console.log(`Original file size: ${formatFileSize(originalSize)}`);
            let imageDimensions = { width: 500, height: 500 };
            let processedFile = file;

            try {
                if (file.type.startsWith('image/')) {
                    imageDimensions = await getImageDimensions(file);
                    setUploadProgress(20);
                    if (supportsCompression(file)) {
                        console.log('Compressing image...');
                        processedFile = await compressImage(file, {
                            maxSizeMB: 1.2,
                            maxWidthOrHeight: 1920,
                            quality: 0.9,
                        });
                        const compressionRatio = getCompressionRatio(originalSize, processedFile.size);
                        console.log(`Compressed file size: ${formatFileSize(processedFile.size)} (${compressionRatio}% reduction)`);
                        if (compressionRatio > 10) {
                            toast.success(`Image compressed by ${compressionRatio}%`);
                        }
                        setUploadProgress(60);
                    }
                }
            } catch (error) {
                console.warn('Could not process image, using original:', error);
            }

            const formData = new FormData();
            formData.append("file", processedFile);
            formData.append("contentType", "image");
            formData.append("description", "Uploaded from museboard");
            formData.append("imageWidth", imageDimensions.width.toString());
            formData.append("imageHeight", imageDimensions.height.toString());

            setUploadProgress(80);
            const result = await uploadFileToMuseboardAction(formData);

            if (result.success && result.data) {
                const { data: signedUrlData, error: signedUrlError } = await supabase.storage
                    .from("muse-files")
                    .createSignedUrl(result.data.filePath, 60 * 60 * 2);

                if (signedUrlError) {
                    console.error("Error creating signed URL:", signedUrlError);
                    toast.error("File uploaded but failed to display. Please refresh the page.");
                    return;
                }

                setUploadProgress(100);
                toast.success("File uploaded successfully!");

                const newItem: MuseItem = {
                    id: uuidv4(), user_id: user.id, created_at: new Date().toISOString(),
                    content: result.data.filePath, content_type: "image", description: "Uploaded from museboard",
                    source_url: null, ai_categories: null, ai_clusters: null, ai_status: "pending",
                    ai_summary: null, ai_insights: null, ai_relevance_score: null, deleted_at: null,
                    image_width: imageDimensions.width, image_height: imageDimensions.height,
                    updated_at: new Date().toISOString(), signedUrl: signedUrlData.signedUrl,
                    height: imageDimensions.height, width: imageDimensions.width,
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
            setUploadProgress(0);
        }
    };

    const handleAddContent = async (content: string, contentType: "text" | "link", options: { description?: string; sourceUrl?: string } = {}) => {
        try {
            const result = await addContentToMuseboardAction(content, contentType, options);
            if (result.success) {
                toast.success(`${contentType === "link" ? "Link" : "Text"} added successfully!`);
                const newItem: MuseItem = {
                    id: uuidv4(), user_id: user.id, created_at: new Date().toISOString(),
                    content, content_type: contentType, description: options.description || null,
                    source_url: options.sourceUrl || null, ai_categories: null, ai_clusters: null,
                    ai_status: "pending", ai_summary: null, ai_insights: null, ai_relevance_score: null,
                    deleted_at: null, image_width: null, image_height: null,
                    updated_at: new Date().toISOString(), height: null, width: null,
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
    }, [handleFileUpload]);

    useEffect(() => {
        const handlePaste = (event: ClipboardEvent) => {
            if (event.clipboardData) {
                const items = event.clipboardData.items;
                for (let i = 0; i < items.length; i++) {
                    const item = items[i];
                    if (item.type.startsWith('image/')) {
                        const file = item.getAsFile();
                        if (file) handleFileUpload(file);
                    } else if (item.type === 'text/plain') {
                        item.getAsString((text) => {
                            if (text.trim()) {
                                if (isUrl(text)) handleAddContent(text, 'link', { sourceUrl: text });
                                else handleAddContent(text, 'text');
                            }
                        });
                    }
                }
            }
        };
        window.addEventListener('paste', handlePaste);
        return () => window.removeEventListener('paste', handlePaste);
    }, [handleFileUpload, handleAddContent]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { "image/*": [".jpeg", ".jpg", ".png", ".gif", ".webp", ".svg"], "video/*": [".mp4", ".webm", ".mov"] },
        noClick: true, noKeyboard: true,
    });

    const handleToggleSelect = (itemId: string) => {
        const newSelection = new Set(selectedItemIds);
        if (newSelection.has(itemId)) newSelection.delete(itemId);
        else newSelection.add(itemId);
        if (newSelection.size === 0) setIsSelectionMode(false);
        else setIsSelectionMode(true);
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
        await actions.softDelete(itemIds);
        handleClearSelection();
    };

    // Updated chat handlers - much simpler now!
    const handleTransformToChat = useCallback((initialMessage: string, attachments?: File[]) => {
        setChatInitialMessage(initialMessage);
        setChatInitialAttachments(attachments || []);
        setIsChatModalOpen(true);
    }, []);

    const handleCloseChatModal = useCallback(() => {
        setIsChatModalOpen(false);
        setChatInitialMessage("");
        setChatInitialAttachments([]);
    }, []);

    const handleMagicBarAddContent = useCallback(async (content: string, type: "text" | "link") => {
        await handleAddContent(content, type);
    }, [handleAddContent]);

    const handleMagicBarFileUpload = useCallback(async (files: File[]) => {
        for (const file of files) {
            await handleFileUpload(file);
        }
    }, [handleFileUpload]);

    const selectedItem = enlargedItemIndex !== null ? museItems[enlargedItemIndex] : null;

    return (
        <>
            {/* Shadow Chat Modal - Clean overlay, no background conflicts */}
            <ShadowChatModal
                isOpen={isChatModalOpen}
                onClose={handleCloseChatModal}
                initialMessage={chatInitialMessage}
                initialAttachments={chatInitialAttachments}
                userMission="Your mission statement" // TODO: Make dynamic
                recentContext={museItems.slice(0, 10)}
            />

            {/* Regular Museboard - Always rendered, no complex state management */}
            <div {...getRootProps()} className="relative min-h-full flex-grow flex flex-col focus:outline-none">
                <input {...getInputProps()} />
                
                <div className="flex-grow pt-8 pb-32">
                    {museItems.length > 0 ? (
                        <div ref={museboardContainerRef} style={{ columnGap: "1rem" }}>
                            {museItems.map((item, index) => (
                                <MuseItemCard
                                    key={item.id} item={item} index={index}
                                    isSelectionMode={isSelectionMode} isSelected={selectedItemIds.has(item.id)}
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
                                Use the Magic Bar below to add your first inspiration or ask Shadow a question.
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
                            <Button variant="destructive" size="sm" onClick={() => handleDelete(Array.from(selectedItemIds))} className="cursor-pointer hover:scale-103 transition-transform" disabled={loading}>
                                <Trash2Icon className="mr-2 size-4" /> Delete
                            </Button>
                            <Button variant="ghost" size="icon" onClick={handleClearSelection} className="text-zinc-400 hover:text-white cursor-pointer hover:scale-103 transition-transform">
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
                                <div className="w-full bg-zinc-200 rounded-full h-1.5 mt-1">
                                    <div className="bg-primary h-1.5 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <MagicBar
                    onTransformToChat={handleTransformToChat}
                    onAddContent={handleMagicBarAddContent}
                    onFileUpload={handleMagicBarFileUpload}
                    disabled={isSelectionMode || isUploading}
                />
            </div>
        </>
    );
}