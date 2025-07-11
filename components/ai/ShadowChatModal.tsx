// components/ai/ShadowChatModal.tsx

"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
    Send, Bot, User, Loader2, X, RotateCcw, Copy, RefreshCw,
    ThumbsUp, ThumbsDown, ChevronDown, Paperclip, ImageIcon, Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useDropzone } from "react-dropzone";
import type { MuseItem, AIMessage, ShadowResponse } from "@/lib/types";

// Memoized components (No changes from previous version)
const UserMessageBubble = React.memo(({ message }: { message: ChatMessage }) => ( <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-end mb-4"> <div className="flex items-start gap-3 max-w-[80%]"> <div className="bg-white text-black rounded-2xl rounded-br-md px-4 py-3 shadow-lg"> <div className="text-sm leading-relaxed whitespace-pre-wrap"> {message.content} </div> {message.attachments && message.attachments.length > 0 && ( <div className="mt-2 flex flex-wrap gap-2"> {message.attachments.map((file, index) => ( <div key={`${file.name}-${index}`} className="flex items-center gap-2 bg-gray-100 rounded-lg px-2 py-1"> <ImageIcon className="w-3 h-3 text-gray-600" /> <span className="text-xs text-gray-700 max-w-[80px] truncate">{file.name}</span> </div> ))} </div> )} <div className="text-xs text-black/60 mt-2 text-right"> {message.timestamp} </div> </div> <div className="flex-shrink-0 w-7 h-7 rounded-full bg-white flex items-center justify-center shadow-md"> <User className="w-3 h-3 text-black" /> </div> </div> </motion.div> ));
UserMessageBubble.displayName = 'UserMessageBubble';
const AIMessageBubble = React.memo(({ message, onCopy, onRegenerate, onReaction }: { message: ChatMessage; onCopy: (content: string) => void; onRegenerate: (id: string) => void; onReaction: (id: string, reaction: 'up' | 'down') => void; }) => ( <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-start gap-3 mb-6 group"> <div className="flex-shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center shadow-lg"> <Bot className="w-3 h-3 text-white" /> </div> <div className="flex-1 min-w-0"> <div className="text-zinc-100 leading-relaxed text-sm whitespace-pre-wrap min-h-[20px]"> {message.isTyping && !message.content ? ( <div className="flex items-center gap-2"> <div className="flex gap-1"> {[...Array(3)].map((_, i) => ( <motion.div key={i} className="w-1.5 h-1.5 bg-zinc-400 rounded-full" animate={{ y: [0, -4, 0], opacity: [0.4, 1, 0.4] }} transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2 }} /> ))} </div> <span className="text-zinc-400 text-xs">Shadow is thinking...</span> </div> ) : ( message.content )} </div> {message.content && !message.isTyping && ( <div className="flex items-center justify-between mt-3"> <div className="text-xs text-zinc-500"> {message.timestamp} </div> <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"> <Button variant="ghost" size="sm" onClick={() => onCopy(message.content)} className="h-6 px-2 text-zinc-400 hover:text-white cursor-pointer"> <Copy className="w-3 h-3" /> </Button> <Button variant="ghost" size="sm" onClick={() => onRegenerate(message.id)} className="h-6 px-2 text-zinc-400 hover:text-white cursor-pointer"> <RefreshCw className="w-3 h-3" /> </Button> <Button variant="ghost" size="sm" onClick={() => onReaction(message.id, 'up')} className="h-6 px-2 text-zinc-400 hover:text-green-400 cursor-pointer"> <ThumbsUp className="w-3 h-3" /> </Button> <Button variant="ghost" size="sm" onClick={() => onReaction(message.id, 'down')} className="h-6 px-2 text-zinc-400 hover:text-red-400 cursor-pointer"> <ThumbsDown className="w-3 h-3" /> </Button> </div> </div> )} </div> </motion.div> ));
AIMessageBubble.displayName = 'AIMessageBubble';


interface ChatMessage extends Omit<AIMessage, 'conversation_id'> {
    isTyping?: boolean;
    timestamp: string;
    attachments?: File[];
}

interface ShadowChatModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialMessage?: string;
    initialAttachments?: File[];
    userMission?: string;
    recentContext?: MuseItem[];
}

export default function ShadowChatModal({
    isOpen,
    onClose,
    initialMessage = "",
    initialAttachments = [],
    userMission = "",
    recentContext = []
}: ShadowChatModalProps) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputValue, setInputValue] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
    const [showScrollButton, setShowScrollButton] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Prevent body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "end"
        });
    }, []);

    useEffect(() => {
        if (messages.length > 0) {
            setTimeout(scrollToBottom, 50);
        }
    }, [messages, scrollToBottom]);

    // Check scroll position
    useEffect(() => {
        const container = chatContainerRef.current;
        if (!container) return;

        const handleScroll = () => {
            const { scrollTop, scrollHeight, clientHeight } = container;
            const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
            setShowScrollButton(!isNearBottom);
        };

        container.addEventListener('scroll', handleScroll);
        return () => container.removeEventListener('scroll', handleScroll);
    }, []);

    // Auto-resize textarea
    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.style.height = "auto";
            inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 120)}px`;
        }
    }, [inputValue]);

    // File handling
    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop: (acceptedFiles) => {
            setAttachedFiles(prev => [...prev, ...acceptedFiles]);
            toast.success(`${acceptedFiles.length} file(s) attached`);
        },
        accept: {
            'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp', '.svg'],
            'application/pdf': ['.pdf'],
            'text/*': ['.txt', '.md'],
        },
        noClick: true,
        noKeyboard: true,
    });

    const removeAttachedFile = (index: number) => {
        setAttachedFiles(prev => prev.filter((_, i) => i !== index));
    };

    // Initialize chat
    const generateContextualWelcome = useCallback((userMission: string, recentItems: MuseItem[]) => {
        const contentTypes = recentItems.map(item => item.content_type);
        const hasImages = contentTypes.includes('image');
        const hasText = contentTypes.includes('text');
        const hasLinks = contentTypes.includes('link');

        let contentInsight = "";
        if (hasImages && hasText) contentInsight = "I can see you collect both visual inspiration and written insights. ";
        else if (hasImages) contentInsight = "I notice you're drawn to visual inspiration. ";
        else if (hasText) contentInsight = "I see you focus on capturing written wisdom. ";
        else if (hasLinks) contentInsight = "I see you're curating valuable resources and links. ";
        
        return `Hey there! 👋 I'm Shadow, your AI muse companion.\n\n${userMission ? `I see your mission is: "${userMission}"\n\n` : ''}${contentInsight}I'm here to help you connect the dots between your inspirations, extract insights from your content, and keep you aligned with your goals.${initialMessage ? '\n\nI see you wanted to discuss something specific. Let me think about that...' : '\n\nWhat would you like to explore together?'}`;
    }, [initialMessage]);

    useEffect(() => {
        if (isOpen && messages.length === 0) {
            const welcomeMessage: ChatMessage = { id: 'welcome', role: 'assistant', content: generateContextualWelcome(userMission, recentContext), metadata: { response_type: 'general', intent: 'welcome' }, created_at: new Date().toISOString(), timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
            setMessages([welcomeMessage]);
            if (initialMessage) {
                setTimeout(() => {
                    const userMessage: ChatMessage = { id: `user-${Date.now()}`, role: 'user', content: initialMessage, attachments: initialAttachments, metadata: null, created_at: new Date().toISOString(), timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
                    setMessages(prev => [...prev, userMessage]);
                    processMessage(initialMessage, initialAttachments);
                }, 1000);
            }
        }
    }, [isOpen]);

    // --- START: --- ✨ CHANGE 1: ALWAYS FOCUS INPUT ✨ ---
    // The condition `&& !initialMessage` is removed.
    // The setTimeout is also removed for more immediate focus.
    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);
    // --- END: --- ✨ CHANGE 1 ✨ ---

    const getMockShadowResponse = async (userMessage: string, attachments: File[] = []): Promise<ShadowResponse> => {
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1500));
        const responses = ["That's a fascinating perspective! Based on your content patterns, I notice you're drawn to themes of growth and innovation. Have you considered how this connects to your current goals?", "I see you're exploring something meaningful here. From your mission and recent saves, there's a clear thread about authentic leadership. What's your next step?", "This reminds me of the content you've been collecting - there's a pattern around resilience and creative problem-solving. Have you considered how this applies to your current challenge?", "Great question! Your Museboard shows you value deep thinking and strategic approaches. What if we looked at this from a different angle?", "I notice your content reflects someone who thinks systemically. This connects beautifully with what you're asking about."];
        if (attachments.length > 0) { responses.unshift(`I can see you've shared ${attachments.length} file${attachments.length > 1 ? 's' : ''} with me. Let me analyze what you've shared and see how it connects to your mission and goals.`); }
        if (userMission) { responses.push(`Given your mission "${userMission}", this question touches on something important. Let me share what I'm seeing...`); }
        const selectedResponse = responses[Math.floor(Math.random() * responses.length)];
        return { content: selectedResponse, referencedItems: [], suggestedActions: [], metadata: { responseType: "insight", confidence: 0.85, processingTime: Math.floor(1000 + Math.random() * 1500), intent: "analysis" }};
    };
    
    const simulateStreamingResponse = async (content: string, messageId: string) => {
        const initialAIMessage: ChatMessage = { id: messageId, role: 'assistant', content: '', isTyping: true, metadata: null, created_at: new Date().toISOString(), timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
        setMessages(prev => [...prev, initialAIMessage]);
        await new Promise(resolve => setTimeout(resolve, 600));
        const words = content.split(' ');
        let partialContent = '';
        for (let i = 0; i < words.length; i++) {
            partialContent += (i > 0 ? ' ' : '') + words[i];
            setMessages(prev => {
                const newMessages = [...prev];
                const lastMessageIndex = newMessages.length - 1;
                if (newMessages[lastMessageIndex]?.id === messageId) {
                    newMessages[lastMessageIndex] = { ...newMessages[lastMessageIndex], content: partialContent, isTyping: true };
                }
                return newMessages;
            });
            await new Promise(resolve => setTimeout(resolve, 40 + Math.random() * 60));
        }
        setMessages(prev => {
            const newMessages = [...prev];
            const lastMessageIndex = newMessages.length - 1;
            if (newMessages[lastMessageIndex]?.id === messageId) {
                newMessages[lastMessageIndex] = { ...newMessages[lastMessageIndex], isTyping: false };
            }
            return newMessages;
        });
    };

    const handleCopyMessage = useCallback((content: string) => { navigator.clipboard.writeText(content); toast.success("Message copied to clipboard"); }, []);
    const handleRegenerateResponse = useCallback(async (messageId: string) => {
        const messageIndex = messages.findIndex(msg => msg.id === messageId);
        const userMessage = messages[messageIndex - 1];
        if (userMessage && userMessage.role === 'user') {
            setMessages(prev => prev.filter(msg => msg.id !== messageId));
            await processMessage(userMessage.content, userMessage.attachments || []);
        }
    }, [messages]);
    const handleReaction = useCallback((messageId: string, reaction: 'up' | 'down') => { toast.success(`Feedback recorded: ${reaction === 'up' ? '👍' : '👎'}`); }, []);

    const processMessage = async (message: string, attachments: File[] = []) => {
        setIsLoading(true);
        try {
            const response = await getMockShadowResponse(message, attachments);
            const assistantMessageId = `assistant-${Date.now()}`;
            await simulateStreamingResponse(response.content, assistantMessageId);
        } catch (error) {
            console.error("Error getting AI response:", error);
            toast.error("Sorry, I'm having trouble responding right now. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSendMessage = async () => {
        if (!inputValue.trim() || isLoading) return;
        const userMessage: ChatMessage = { id: `user-${Date.now()}`, role: 'user', content: inputValue.trim(), attachments: attachedFiles.length > 0 ? [...attachedFiles] : undefined, metadata: null, created_at: new Date().toISOString(), timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
        setMessages(prev => [...prev, userMessage]);
        const messageToProcess = inputValue.trim();
        const attachmentsToProcess = [...attachedFiles];
        setInputValue("");
        setAttachedFiles([]);
        await processMessage(messageToProcess, attachmentsToProcess);
    };

    const handleKeyPress = (e: React.KeyboardEvent) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } };
    const handleClearChat = () => { setMessages([]); toast.success("Chat cleared"); };
    const handleFileSelect = () => { fileInputRef.current?.click(); };
    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length > 0) {
            setAttachedFiles(prev => [...prev, ...files]);
            toast.success(`${files.length} file(s) attached`);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
                onClick={onClose}
            >
                {/* --- START: --- ✨ CHANGE 2: PREVENT CLOSE ON CLICK ✨ --- */}
                {/* The dropzone props are on this outer div... */}
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    className="w-full max-w-4xl h-[85vh]"
                    {...getRootProps()}
                >
                    {/* ...and the click-stopping logic is on this new inner div. */}
                    {/* This cleanly separates the two functionalities. */}
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className="bg-black rounded-2xl border border-zinc-800 w-full h-full flex flex-col shadow-2xl"
                    >
                        <input {...getInputProps()} />

                        {/* Header (No changes) */}
                        <div className="flex-shrink-0 px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
                                    <Sparkles className="w-4 h-4 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-white">Shadow</h2>
                                    <p className="text-xs text-zinc-400">Your AI Muse Companion</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {messages.length > 1 && (<Button variant="ghost" size="sm" onClick={handleClearChat} className="text-zinc-400 hover:text-white cursor-pointer"><RotateCcw className="w-4 h-4 mr-2" />Clear</Button>)}
                                <Button variant="ghost" size="icon" onClick={onClose} className="text-zinc-400 hover:text-white cursor-pointer"><X className="w-4 h-4" /></Button>
                            </div>
                        </div>

                        {/* Messages */}
                        <div ref={chatContainerRef} className="flex-1 overflow-y-auto px-6 py-4">
                            {messages.map((message) => (
                                message.role === 'user' ? (
                                    <UserMessageBubble key={message.id} message={message} />
                                ) : (
                                    <AIMessageBubble 
                                        key={message.id} 
                                        message={message}
                                        onCopy={handleCopyMessage}
                                        onRegenerate={handleRegenerateResponse}
                                        onReaction={handleReaction}
                                    />
                                )
                            ))}
                            <div ref={messagesEndRef} />

                            {showScrollButton && (
                                <motion.button
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    onClick={scrollToBottom}
                                    className="fixed bottom-24 right-8 w-8 h-8 bg-zinc-800 hover:bg-zinc-700 rounded-full flex items-center justify-center cursor-pointer"
                                >
                                    <ChevronDown className="w-4 h-4 text-white" />
                                </motion.button>
                            )}
                        </div>

                        {/* Input and the rest of the component (No changes) */}
                        <div className="flex-shrink-0 p-4 border-t border-zinc-800">
                            {recentContext.length > 0 && ( <div className="mb-3 text-center"> <div className="inline-flex items-center gap-2 text-xs text-zinc-500 bg-zinc-900/50 px-3 py-1 rounded-full"> <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-pulse" /> <span>Context: {recentContext.length} items from your Museboard</span> </div> </div> )}
                            {attachedFiles.length > 0 && ( <div className="mb-3 flex flex-wrap gap-2"> {attachedFiles.map((file, index) => ( <div key={`${file.name}-${index}`} className="flex items-center gap-2 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1"> <ImageIcon className="w-3 h-3 text-zinc-400" /> <span className="text-xs text-zinc-300 max-w-[100px] truncate">{file.name}</span> <button onClick={() => removeAttachedFile(index)} className="text-zinc-400 hover:text-white cursor-pointer"> <X className="w-3 h-3" /> </button> </div> ))} </div> )}
                            <div className="chat-input-gradient rounded-xl p-3">
                                <div className="flex gap-3 items-end">
                                    <div className="flex-1">
                                        <textarea ref={inputRef} value={inputValue} onChange={(e) => setInputValue(e.target.value)} onKeyDown={handleKeyPress} placeholder="Continue your conversation with Shadow..." className="w-full bg-transparent text-white placeholder-zinc-400 resize-none outline-none text-sm leading-relaxed" rows={1} style={{ minHeight: '20px', maxHeight: '100px', height: 'auto' }} />
                                    </div>
                                    <Button variant="ghost" size="icon" onClick={handleFileSelect} className="text-zinc-400 hover:text-white cursor-pointer"> <Paperclip className="w-4 h-4" /> </Button>
                                    <Button onClick={handleSendMessage} disabled={!inputValue.trim() || isLoading} className="send-button-gradient rounded-lg px-3 py-2 cursor-pointer" size="sm">
                                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                    </Button>
                                </div>
                            </div>
                            <input ref={fileInputRef} type="file" multiple accept="image/*,.pdf,.doc,.docx,.txt,.md" className="hidden" onChange={handleFileInputChange} />
                        </div>

                        {isDragActive && (
                            <div className="absolute inset-0 bg-purple-500/20 backdrop-blur-sm flex items-center justify-center z-10 rounded-2xl">
                                <div className="text-center"> <Paperclip className="w-8 h-8 text-purple-400 mx-auto mb-2" /> <p className="text-purple-300 font-medium">Drop files to attach</p> </div>
                            </div>
                        )}
                    </div>
                </motion.div>
                {/* --- END: --- ✨ CHANGE 2 ✨ --- */}
            </motion.div>
        </AnimatePresence>
    );
}