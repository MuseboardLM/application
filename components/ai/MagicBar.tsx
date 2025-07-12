"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Send,
    Sparkles,
    MessageSquare,
    Plus,
    Link as LinkIcon,
    Paperclip,
    Image as ImageIcon,
    X
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useDropzone } from "react-dropzone";
import type { MagicBarAction } from "@/lib/types";

interface MagicBarProps {
    onTransformToChat: (initialMessage: string, attachments?: File[]) => void;
    onAddContent: (content: string, type: "text" | "link") => void;
    onFileUpload: (files: File[]) => void;
    className?: string;
    disabled?: boolean;
}

// A simple, static placeholder for the initial server render and client hydration
const STATIC_PLACEHOLDER = "Ask Shadow a question or add to your Museboard...";

export default function MagicBar({
    onTransformToChat,
    onAddContent,
    onFileUpload,
    className,
    disabled = false
}: MagicBarProps) {
    const [value, setValue] = useState("");
    const [isVisible, setIsVisible] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [lastScrollY, setLastScrollY] = useState(0);
    const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
    const [showFileMenu, setShowFileMenu] = useState(false);
    
    // [FIX] Use state for the placeholder to prevent hydration mismatch.
    const [placeholder, setPlaceholder] = useState(STATIC_PLACEHOLDER);

    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
        }
    }, [value]);

    const handleScroll = useCallback(() => {
        const currentScrollY = window.scrollY;
        if (currentScrollY > lastScrollY && currentScrollY > 100) {
            setIsVisible(false);
        } else if (currentScrollY < lastScrollY || currentScrollY < 50) {
            setIsVisible(true);
        }
        setLastScrollY(currentScrollY);
    }, [lastScrollY]);

    useEffect(() => {
        window.addEventListener("scroll", handleScroll);
        return () => {
            window.removeEventListener("scroll", handleScroll);
        };
    }, [handleScroll]);

    // [FIX] Move the dynamic placeholder logic into a client-side only effect.
    useEffect(() => {
        // This function will only be called on the client, after hydration.
        const getSmartPlaceholder = () => {
            const hour = new Date().getHours();
            const timeBasedPlaceholders = {
                morning: [
                    "Good morning! What's inspiring you today?",
                    "Ask Shadow about your goals for today...",
                    "Share something that motivates you...",
                ],
                afternoon: [
                    "How can Shadow help you stay focused?",
                    "What insights are you discovering?",
                    "Ask Shadow about your progress...",
                ],
                evening: [
                    "Evening reflection time with Shadow...",
                    "What did you learn today?",
                    "Ask Shadow for tomorrow's guidance...",
                ]
            };

            let timeCategory: keyof typeof timeBasedPlaceholders;
            if (hour < 12) timeCategory = "morning";
            else if (hour < 18) timeCategory = "afternoon";
            else timeCategory = "evening";

            const placeholders = timeBasedPlaceholders[timeCategory];
            return placeholders[Math.floor(Date.now() / 4000) % placeholders.length];
        };

        // Set up an interval to cycle through the smart placeholders.
        const intervalId = setInterval(() => {
            setPlaceholder(getSmartPlaceholder());
        }, 4000);

        // Cleanup interval on component unmount.
        return () => clearInterval(intervalId);
    }, []); // Empty dependency array ensures this runs only on the client after the component mounts.

    const detectIntent = useCallback((input: string): MagicBarAction => {
        const trimmedInput = input.trim().toLowerCase();
        if (attachedFiles.length > 0) {
            return { type: "chat", intent: "chat_with_files", confidence: 0.95, data: { chatMessage: input.trim() } };
        }
        const chatPatterns = [/^(what|how|why|when|where|who|can|should|would|could|is|are|do|does|did)/, /\?$/, /^(help|explain|tell me|show me|find|search)/, /^(analyze|summarize|insights?|thoughts?|advice)/, /shadow/i];
        const urlPattern = /^https?:\/\/|www\./;

        if (urlPattern.test(trimmedInput)) {
            return { type: "add_content", intent: "add_link", confidence: 0.95, data: { contentType: "link", content: input.trim() } };
        }
        if (chatPatterns.some(pattern => pattern.test(trimmedInput))) {
            return { type: "chat", intent: "question_or_chat", confidence: 0.85, data: { chatMessage: input.trim() } };
        }
        return { type: "add_content", intent: "add_text", confidence: 0.7, data: { contentType: "text", content: input.trim() } };
    }, [attachedFiles.length]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop: (acceptedFiles) => {
            setAttachedFiles(prev => [...prev, ...acceptedFiles]);
            toast.success(`${acceptedFiles.length} file(s) attached`);
        },
        accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp', '.svg'], 'application/pdf': ['.pdf'], 'text/*': ['.txt', '.md'], 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'], 'application/msword': ['.doc'] },
        noClick: true, noKeyboard: true, disabled: disabled || isProcessing
    });

    const handleFileSelect = (type: 'image' | 'document') => {
        if (fileInputRef.current) {
            fileInputRef.current.accept = type === 'image' ? 'image/*' : '.pdf,.doc,.docx,.txt,.md';
            fileInputRef.current.click();
        }
        setShowFileMenu(false);
    };

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length > 0) {
            setAttachedFiles(prev => [...prev, ...files]);
            toast.success(`${files.length} file(s) attached`);
        }
    };

    const removeAttachedFile = (index: number) => {
        setAttachedFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        if ((!value.trim() && attachedFiles.length === 0) || disabled || isProcessing) return;
        setIsProcessing(true);
        try {
            const action = detectIntent(value);
            if (!value.trim() && attachedFiles.length > 0) {
                toast.success("Uploading files...", { icon: "📎", duration: 2000 });
                onFileUpload(attachedFiles);
                setAttachedFiles([]);
                setValue("");
                return;
            }
            if (action.type === "chat") {
                toast.success(attachedFiles.length > 0 ? "Starting chat with attachments..." : "Starting chat with Shadow...", { icon: attachedFiles.length > 0 ? "📎💭" : "💭", duration: 2000 });
                onTransformToChat(value.trim(), attachedFiles);
                setAttachedFiles([]);
            } else if (action.type === "add_content") {
                const contentType = action.data.contentType as "text" | "link";
                if (contentType === "link") {
                    toast.success("Adding link to your Museboard...", { icon: "🔗", duration: 2000 });
                } else {
                    toast.success("Adding text to your Museboard...", { icon: "📝", duration: 2000 });
                }
                onAddContent(value.trim(), contentType);
            }
            setValue("");
        } catch (error) {
            console.error("Error processing Magic Bar input:", error);
            toast.error("Something went wrong. Please try again.");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    const getIntentPreview = (action: MagicBarAction) => {
        const baseClasses = "text-xs px-3 py-1.5 rounded-full backdrop-blur-sm border flex items-center gap-2 transition-all duration-200";
        if (action.type === "chat") {
            return (
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className={`${baseClasses} bg-purple-500/20 text-purple-300 border-purple-500/40`}>
                    <MessageSquare className="w-3 h-3" />
                    <span>{attachedFiles.length > 0 ? `Chat with Shadow (${attachedFiles.length} file${attachedFiles.length > 1 ? 's' : ''})` : "Chat with Shadow"}</span>
                    <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-pulse" />
                </motion.div>
            );
        } else if (action.data.contentType === "link") {
            return (
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className={`${baseClasses} bg-blue-500/20 text-blue-300 border-blue-500/40`}>
                    <LinkIcon className="w-3 h-3" />
                    <span>Add link to Museboard</span>
                </motion.div>
            );
        } else {
            return (
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className={`${baseClasses} bg-green-500/20 text-green-300 border-green-500/40`}>
                    <Plus className="w-3 h-3" />
                    <span>Add text to Museboard</span>
                </motion.div>
            );
        }
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    ref={containerRef}
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30, duration: 0.3 }}
                    className={cn("fixed bottom-6 left-6 right-6 z-50", className)}
                >
                    <div className="max-w-4xl mx-auto">
                        <AnimatePresence>
                            {attachedFiles.length > 0 && (
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="mb-3 flex flex-wrap gap-2">
                                    {attachedFiles.map((file, index) => (
                                        <motion.div key={`${file.name}-${index}`} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex items-center gap-2 bg-zinc-900/80 backdrop-blur-sm border border-zinc-700 rounded-lg px-3 py-2">
                                            <ImageIcon className="w-4 h-4 text-zinc-400" />
                                            <span className="text-xs text-zinc-300 max-w-[120px] truncate">{file.name}</span>
                                            <button onClick={() => removeAttachedFile(index)} className="text-zinc-400 hover:text-white transition-colors cursor-pointer"><X className="w-3 h-3" /></button>
                                        </motion.div>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                        <div
                            {...getRootProps()}
                            className={cn("chat-input-gradient flex items-end gap-3 p-4 rounded-2xl transition-all duration-200", "shadow-2xl border border-white/10 backdrop-blur-xl", "bg-black/80", disabled && "opacity-50", isDragActive && "border-purple-500/50 bg-purple-500/10")}
                        >
                            <input {...getInputProps()} />
                            <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 shadow-lg">
                                <Sparkles className="w-4 h-4 text-white" />
                            </div>
                            <textarea
                                ref={textareaRef}
                                value={value}
                                onChange={(e) => setValue(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder={attachedFiles.length > 0 ? "Ask Shadow about these files..." : placeholder}
                                disabled={disabled || isProcessing}
                                rows={1}
                                className={cn("flex-1 resize-none bg-transparent border-0 outline-none", "placeholder:text-muted-foreground/60 text-white text-sm", "min-h-[2.5rem] max-h-32 py-2 leading-relaxed", (disabled || isProcessing) && "opacity-50 cursor-not-allowed")}
                            />
                            <div className="relative">
                                <button onClick={() => setShowFileMenu(!showFileMenu)} className="flex items-center justify-center w-10 h-10 rounded-full bg-zinc-800/50 hover:bg-zinc-700/50 transition-colors cursor-pointer" disabled={disabled || isProcessing}>
                                    <Paperclip className="w-4 h-4 text-zinc-300" />
                                </button>
                                <AnimatePresence>
                                    {showFileMenu && (
                                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} className="absolute bottom-full right-0 mb-2 bg-zinc-900/90 backdrop-blur-sm border border-zinc-700 rounded-lg p-2 min-w-[150px]">
                                            <button onClick={() => handleFileSelect('image')} className="flex items-center gap-2 w-full px-3 py-2 text-sm text-zinc-300 hover:text-white hover:bg-zinc-800/50 rounded-md transition-colors cursor-pointer">
                                                <ImageIcon className="w-4 h-4" /> Images
                                            </button>
                                            <button onClick={() => handleFileSelect('document')} className="flex items-center gap-2 w-full px-3 py-2 text-sm text-zinc-300 hover:text-white hover:bg-zinc-800/50 rounded-md transition-colors cursor-pointer">
                                                <Paperclip className="w-4 h-4" /> Documents
                                            </button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                            <button
                                onClick={handleSubmit}
                                disabled={(!value.trim() && attachedFiles.length === 0) || disabled || isProcessing}
                                className={cn("send-button-gradient flex items-center justify-center w-10 h-10 rounded-full", "text-primary-foreground transition-all duration-200", "hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed", "disabled:hover:scale-100 shrink-0 shadow-lg cursor-pointer")}
                            >
                                {isProcessing ? (<div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />) : (<Send className="w-4 h-4" />)}
                            </button>
                            <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileInputChange} />
                        </div>
                        <AnimatePresence>
                            {(value.trim() || attachedFiles.length > 0) && (
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="mt-3 flex justify-center">
                                    {getIntentPreview(detectIntent(value))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                        {isDragActive && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-purple-500/20 backdrop-blur-sm rounded-2xl border-2 border-dashed border-purple-500 flex items-center justify-center">
                                <div className="text-center">
                                    <Paperclip className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                                    <p className="text-purple-300 font-medium">Drop files to attach</p>
                                </div>
                            </motion.div>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}