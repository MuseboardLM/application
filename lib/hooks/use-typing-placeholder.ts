// lib/hooks/use-typing-placeholder.ts

import { useState, useEffect, useCallback } from 'react';

interface UseTypingPlaceholderOptions {
  placeholders: string[];
  typingSpeed?: number;
  pauseDuration?: number;
  enabled?: boolean;
}

export function useTypingPlaceholder({
  placeholders,
  typingSpeed = 50,
  pauseDuration = 2000,
  enabled = true,
}: UseTypingPlaceholderOptions) {
  const [currentPlaceholder, setCurrentPlaceholder] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [showCursor, setShowCursor] = useState(true);

  // Cursor blinking effect
  useEffect(() => {
    const interval = setInterval(() => {
      setShowCursor(prev => !prev);
    }, 500);

    return () => clearInterval(interval);
  }, []);

  // Main typing animation logic
  useEffect(() => {
    if (!enabled || placeholders.length === 0) {
      setCurrentPlaceholder('');
      return;
    }

    let timeoutId: NodeJS.Timeout;
    
    const typeText = () => {
      const targetText = placeholders[currentIndex];
      let charIndex = 0;
      
      setIsTyping(true);
      setCurrentPlaceholder('');
      
      const typeChar = () => {
        if (charIndex < targetText.length) {
          setCurrentPlaceholder(targetText.slice(0, charIndex + 1));
          charIndex++;
          timeoutId = setTimeout(typeChar, typingSpeed);
        } else {
          setIsTyping(false);
          // Pause before moving to next placeholder
          timeoutId = setTimeout(() => {
            setCurrentIndex((prev) => (prev + 1) % placeholders.length);
          }, pauseDuration);
        }
      };
      
      typeChar();
    };

    // Start typing animation
    typeText();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [currentIndex, placeholders, typingSpeed, pauseDuration, enabled]);

  // Reset animation when placeholders change
  useEffect(() => {
    setCurrentIndex(0);
    setCurrentPlaceholder('');
  }, [placeholders]);

  const displayText = currentPlaceholder + (showCursor ? '|' : ' ');

  return {
    placeholder: displayText,
    isTyping,
    currentIndex,
  };
}