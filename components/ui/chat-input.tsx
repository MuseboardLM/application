// components/ui/chat-input.tsx

"use client";

import { useState, useRef, useEffect } from "react";
import { Send, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTypingPlaceholder } from "@/lib/hooks/use-typing-placeholder";

interface ChatInputProps {
  placeholder?: string;
  animatedPlaceholders?: string[];
  onSubmit: (value: string) => void;
  disabled?: boolean;
  className?: string;
  showSendButton?: boolean;
  buttonText?: string;
  rows?: number;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  typingSpeed?: number;
  pauseDuration?: number;
}

export function ChatInput({
  placeholder = "Type your message...",
  animatedPlaceholders,
  onSubmit,
  disabled = false,
  className,
  showSendButton = true,
  buttonText,
  rows = 1,
  onChange,
  typingSpeed = 50,
  pauseDuration = 2000,
}: ChatInputProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [charCount, setCharCount] = useState(0);
  const [isFocused, setIsFocused] = useState(false);

  // Use animated placeholders if provided, otherwise use static placeholder
  const { placeholder: animatedPlaceholder } = useTypingPlaceholder({
    placeholders: animatedPlaceholders || [],
    typingSpeed,
    pauseDuration,
    enabled: !isFocused && !value && !!animatedPlaceholders?.length,
  });

  // Determine which placeholder to show
  const displayPlaceholder = animatedPlaceholders?.length 
    ? (isFocused || value ? placeholder : animatedPlaceholder)
    : placeholder;

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [value]);

  const handleSubmit = () => {
    if (value.trim() && !disabled) {
      onSubmit(value.trim());
      setValue("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  return (
    <div className={cn(
      "chat-input-gradient flex items-end gap-3 p-4 rounded-2xl transition-all duration-200",
      className
    )}>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          setCharCount(e.target.value.length);
          onChange?.(e);
        }}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={displayPlaceholder}
        disabled={disabled}
        rows={rows}
        className={cn(
          "flex-1 resize-none bg-transparent border-0 outline-none",
          "placeholder:text-muted-foreground/60 text-sm",
          "min-h-[2.5rem] max-h-32 py-2",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      />
      
      {showSendButton && (
        <button
          onClick={handleSubmit}
          disabled={!value.trim() || disabled}
          className={cn(
            "send-button-gradient flex items-center justify-center w-10 h-10 rounded-full",
            "text-primary-foreground transition-all duration-200",
            "hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed",
            "disabled:hover:scale-100 shrink-0"
          )}
        >
          {buttonText ? (
            <ArrowRight className="w-4 h-4" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </button>
      )}
    </div>
  );
}