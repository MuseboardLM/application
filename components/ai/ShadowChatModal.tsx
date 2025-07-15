// components/ai/ShadowChatModal.tsx

"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Send, Bot, User, Loader2, X, RotateCcw, Copy, RefreshCw, ThumbsUp, ThumbsDown, ChevronDown, Paperclip, ImageIcon, Sparkles, FileText, Link as LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useDropzone } from "react-dropzone";
import type { MuseItem, AIMessage } from "@/lib/types";
import { chatWithShadowAction } from "@/lib/actions/shadow";
import Markdown from 'react-markdown';

// The 'Source' type is essentially a MuseItem, so we can use that directly.
// This component displays a retrieved source item in the chat.
const SourcePill = React.memo(({ source }: { source: MuseItem }) => {
  const getIcon = () => {
    switch (source.content_type) {
      case 'image': return <ImageIcon className="w-3 h-3" />;
      case 'text': return <FileText className="w-3 h-3" />;
      case 'link': return <LinkIcon className="w-3 h-3" />;
      default: return <FileText className="w-3 h-3" />;
    }
  };
  return (
    <div className="bg-zinc-800/80 p-2 rounded-lg text-xs text-zinc-400 flex items-center gap-2 max-w-full hover:bg-zinc-700/80 transition-colors cursor-pointer">
      <div className="flex-shrink-0">{getIcon()}</div>
      <p className="truncate flex-1">{source.description || source.content}</p>
    </div>
  );
});
SourcePill.displayName = 'SourcePill';

// (UserMessageBubble component remains unchanged)
const UserMessageBubble = React.memo(({ message }: { message: ChatMessage }) => ( <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-end mb-4"> <div className="flex items-start gap-3 max-w-[80%]"> <div className="bg-white text-black rounded-2xl rounded-br-md px-4 py-3 shadow-lg"> <div className="text-sm leading-relaxed whitespace-pre-wrap"> {message.content} </div> {message.attachments && message.attachments.length > 0 && ( <div className="mt-2 flex flex-wrap gap-2"> {message.attachments.map((file, index) => ( <div key={`${file.name}-${index}`} className="flex items-center gap-2 bg-gray-100 rounded-lg px-2 py-1"> <ImageIcon className="w-3 h-3 text-gray-600" /> <span className="text-xs text-gray-700 max-w-[80px] truncate">{file.name}</span> </div> ))} </div> )} <div className="text-xs text-black/60 mt-2 text-right"> {message.timestamp} </div> </div> <div className="flex-shrink-0 w-7 h-7 rounded-full bg-white flex items-center justify-center shadow-md"> <User className="w-3 h-3 text-black" /> </div> </div> </motion.div> ));
UserMessageBubble.displayName = 'UserMessageBubble';

// (AIMessageBubble component remains unchanged)
const AIMessageBubble = React.memo(({ message, onCopy, onRegenerate, onReaction }: { message: ChatMessage; onCopy: (content: string) => void; onRegenerate: (id: string) => void; onReaction: (id: string, reaction: 'up' | 'down') => void; }) => (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-start gap-3 mb-6 group">
        <div className="flex-shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center shadow-lg">
            <Bot className="w-3 h-3 text-white" />
        </div>
        <div className="flex-1 min-w-0">
            <div className="prose prose-sm prose-invert leading-relaxed max-w-none">
                {message.isTyping && !message.content ? (
                    <div className="flex items-center gap-2"> <div className="flex gap-1"> {[...Array(3)].map((_, i) => ( <motion.div key={i} className="w-1.5 h-1.5 bg-zinc-400 rounded-full" animate={{ y: [0, -4, 0], opacity: [0.4, 1, 0.4] }} transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2 }} /> ))} </div> <span className="text-zinc-400 text-xs">Shadow is thinking...</span> </div>
                ) : (
                    <Markdown>{message.content}</Markdown>
                )}
            </div>

            {message.sources && message.sources.length > 0 && (
                <div className="mt-4 border-t border-zinc-800 pt-3">
                    <h4 className="text-xs font-semibold text-zinc-500 mb-2">Sources</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {message.sources.map(source => <SourcePill key={source.id} source={source} />)}
                    </div>
                </div>
            )}

            {message.content && !message.isTyping && (
                <div className="flex items-center justify-between mt-3">
                    <div className="text-xs text-zinc-500">{message.timestamp}</div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="sm" onClick={() => onCopy(message.content)} className="h-6 px-2 text-zinc-400 hover:text-white"><Copy className="w-3 h-3" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => onRegenerate(message.id)} className="h-6 px-2 text-zinc-400 hover:text-white"><RefreshCw className="w-3 h-3" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => onReaction(message.id, 'up')} className="h-6 px-2 text-zinc-400 hover:text-green-400"><ThumbsUp className="w-3 h-3" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => onReaction(message.id, 'down')} className="h-6 px-2 text-zinc-400 hover:text-red-400"><ThumbsDown className="w-3 h-3" /></Button>
                    </div>
                </div>
            )}
        </div>
    </motion.div>
));
AIMessageBubble.displayName = 'AIMessageBubble';

// The shape of a message object in our chat's state
interface ChatMessage extends Omit<AIMessage, 'conversation_id' | 'metadata'> {
    isTyping?: boolean;
    timestamp: string;
    attachments?: File[];
    sources?: MuseItem[];
    metadata?: any;
}

// The props for the main modal component
interface ShadowChatModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialMessage?: string;
    initialAttachments?: File[];
    // New props specifically for handling search results
    initialAnswer?: string;
    initialSources?: MuseItem[];
    // Context props
    userMission?: string;
    recentContext?: MuseItem[];
}

export default function ShadowChatModal({
    isOpen,
    onClose,
    initialMessage = "",
    initialAttachments = [],
    initialAnswer,
    initialSources,
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

    const onDrop = useCallback((acceptedFiles: File[]) => {
        setAttachedFiles(prev => [...prev, ...acceptedFiles]);
        toast.success(`${acceptedFiles.length} file(s) attached`);
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        noClick: true,
        noKeyboard: true
    });

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
        const chatContainer = chatContainerRef.current;
        const handleScroll = () => {
            if (chatContainer) {
                const isScrolledToBottom = chatContainer.scrollHeight - chatContainer.scrollTop <= chatContainer.clientHeight + 1;
                setShowScrollButton(!isScrolledToBottom);
            }
        };
        chatContainer?.addEventListener('scroll', handleScroll);
        return () => chatContainer?.removeEventListener('scroll', handleScroll);
    }, [messages]);

    const removeAttachedFile = (index: number) => {
        setAttachedFiles(prev => prev.filter((_, i) => i !== index));
    };

    const processMessage = useCallback(async (message: string, attachments: File[] = []) => {
        setIsLoading(true);
        const assistantMessageId = `assistant-${Date.now()}`;
        const initialAIMessage: ChatMessage = { id: assistantMessageId, role: 'assistant', content: '', isTyping: true, metadata: null, created_at: new Date().toISOString(), timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
        setMessages(prev => [...prev, initialAIMessage]);

        try {
            if (attachments.length > 0) toast.warning("File attachments are not yet fully supported in chat.");
            const result = await chatWithShadowAction(message);

            if (result.success && result.data?.response) {
                setMessages(prev => prev.map(msg => msg.id === assistantMessageId ? { ...msg, content: result.data.response, isTyping: false } : msg));
            } else {
                const errorMessage = result.error || "Sorry, I'm having trouble responding right now.";
                setMessages(prev => prev.map(msg => msg.id === assistantMessageId ? { ...msg, content: errorMessage, isTyping: false } : msg));
                toast.error(errorMessage);
            }
        } catch (error) {
            console.error("Error calling chatWithShadowAction:", error);
            const errorMessage = "An unexpected error occurred. Please try again.";
            setMessages(prev => prev.map(msg => msg.id === assistantMessageId ? { ...msg, content: errorMessage, isTyping: false } : msg));
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    }, []);
    
    // This useEffect hook now cleanly handles initializing the chat
    // for both regular conversations and search results.
    useEffect(() => {
        if (isOpen && messages.length === 0) {
            // Case 1: This is a search result (initialAnswer is provided)
            if (initialAnswer) {
                const userQueryMessage: ChatMessage = {
                    id: `user-search-${Date.now()}`,
                    role: 'user',
                    content: initialMessage, // The original search query
                    created_at: new Date().toISOString(),
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                };
                const aiResponseMessage: ChatMessage = {
                    id: 'search-result',
                    role: 'assistant',
                    content: initialAnswer, // The AI-synthesized answer
                    sources: initialSources, // The retrieved sources
                    created_at: new Date().toISOString(),
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                };
                setMessages([userQueryMessage, aiResponseMessage]);
            } 
            // Case 2: This is a regular chat session
            else {
                const generateContextualWelcome = (mission: string) => 
                    `Hey there! 👋 I'm Shadow, your AI muse companion.\n\n${mission ? `I see your mission is: "${mission}"\n\n` : ''}I'm here to help you connect the dots between your inspirations, extract insights, and keep you aligned with your goals.${initialMessage ? '\n\nI see you wanted to discuss something specific. Let me think about that...' : '\n\nWhat would you like to explore together?'}`;
                
                const firstMessage: ChatMessage = { 
                    id: 'welcome', 
                    role: 'assistant', 
                    content: generateContextualWelcome(userMission), 
                    created_at: new Date().toISOString(), 
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                };
                setMessages([firstMessage]);

                if (initialMessage) {
                    setTimeout(() => {
                        const userMessage: ChatMessage = { id: `user-${Date.now()}`, role: 'user', content: initialMessage, attachments: initialAttachments, metadata: null, created_at: new Date().toISOString(), timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
                        setMessages(prev => [...prev, userMessage]);
                        processMessage(initialMessage, initialAttachments);
                    }, 500);
                }
            }
        }
    }, [isOpen, initialMessage, initialAttachments, initialAnswer, initialSources, messages.length, processMessage, userMission]);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);
    
    const handleSendMessage = async () => {
        if (!inputValue.trim() || isLoading) return;
        
        const userMessage: ChatMessage = { 
            id: `user-${Date.now()}`, 
            role: 'user', 
            content: inputValue.trim(), 
            attachments: attachedFiles.length > 0 ? [...attachedFiles] : undefined, 
            metadata: null, 
            created_at: new Date().toISOString(), 
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
        };
        setMessages(prev => [...prev, userMessage]);

        const messageToProcess = inputValue.trim();
        const attachmentsToProcess = [...attachedFiles];
        
        setInputValue("");
        setAttachedFiles([]);
        
        await processMessage(messageToProcess, attachmentsToProcess);
    };
    
    const handleCopyMessage = useCallback((content: string) => { navigator.clipboard.writeText(content); toast.success("Message copied to clipboard"); }, []);
    
    const handleRegenerateResponse = useCallback(async (messageId: string) => {
        const messageIndex = messages.findIndex(msg => msg.id === messageId);
        const userMessage = messages[messageIndex - 1];
        if (userMessage && userMessage.role === 'user') {
            setMessages(prev => prev.filter(msg => msg.id !== messageId));
            await processMessage(userMessage.content, userMessage.attachments || []);
        }
    }, [messages, processMessage]);

    const handleReaction = useCallback((messageId: string, reaction: 'up' | 'down') => { toast.success(`Feedback recorded: ${reaction === 'up' ? '👍' : '👎'}`); }, []);
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
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    className="w-full max-w-4xl h-[85vh]"
                    {...getRootProps()}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className="bg-black rounded-2xl border border-zinc-800 w-full h-full flex flex-col shadow-2xl"
                    >
                        <input {...getInputProps()} />

                        {/* Header */}
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
                        <div ref={chatContainerRef} className="flex-1 overflow-y-auto px-6 py-4 relative">
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
                                    className="absolute bottom-4 right-6 w-8 h-8 bg-zinc-800/80 backdrop-blur-sm hover:bg-zinc-700 rounded-full flex items-center justify-center cursor-pointer"
                                >
                                    <ChevronDown className="w-4 h-4 text-white" />
                                </motion.button>
                            )}
                        </div>

                        {/* Input */}
                        <div className="flex-shrink-0 p-4 border-t border-zinc-800">
                            {recentContext.length > 0 && !initialAnswer && ( <div className="mb-3 text-center"> <div className="inline-flex items-center gap-2 text-xs text-zinc-500 bg-zinc-900/50 px-3 py-1 rounded-full"> <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-pulse" /> <span>Context: {recentContext.length} items from your Museboard</span> </div> </div> )}
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
                            <div className="absolute inset-0 bg-purple-500/20 backdrop-blur-sm flex items-center justify-center z-10 rounded-2xl border-2 border-dashed border-purple-400">
                                <div className="text-center"> <Paperclip className="w-8 h-8 text-purple-400 mx-auto mb-2" /> <p className="text-purple-300 font-medium">Drop files to attach</p> </div>
                            </div>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
