// hooks/use-long-press.ts

import { useCallback, useRef } from 'react';

// Define the options for the hook
interface LongPressOptions {
  shouldPreventDefault?: boolean;
  delay?: number;
}

export const useLongPress = (
  onLongPress: (event: React.MouseEvent | React.TouchEvent) => void,
  onClick?: (event: React.MouseEvent | React.TouchEvent) => void,
  options: LongPressOptions = {}
) => {
  const { shouldPreventDefault = true, delay = 400 } = options;
  const timeout = useRef<NodeJS.Timeout | null>(null);
  const longPressTriggered = useRef(false);

  const start = useCallback(
    (event: React.MouseEvent | React.TouchEvent) => {
      if (shouldPreventDefault && event.target) {
        const target = event.target as HTMLElement;
        target.addEventListener('contextmenu', (e) => e.preventDefault(), { once: true });
      }
      
      longPressTriggered.current = false;
      timeout.current = setTimeout(() => {
        onLongPress(event);
        longPressTriggered.current = true;
      }, delay);
    },
    [onLongPress, delay, shouldPreventDefault]
  );

  const clear = useCallback(() => {
    if (timeout.current) {
      clearTimeout(timeout.current);
    }
  }, []);

  const handleClick = useCallback(
    (event: React.MouseEvent | React.TouchEvent) => {
      // If a long press hasn't happened, and we have an onClick handler...
      if (onClick && !longPressTriggered.current) {
        // --- THIS IS THE FIX ---
        // Prevent the browser from firing a "click" event after a "touchend" event.
        if (shouldPreventDefault) {
          event.preventDefault(); 
        }
        onClick(event);
      }
    },
    [onClick, shouldPreventDefault] // Added shouldPreventDefault to dependency array
  );

  return {
    onMouseDown: (e: React.MouseEvent) => start(e),
    onTouchStart: (e: React.TouchEvent) => start(e),
    onMouseUp: (e: React.MouseEvent) => {
      clear();
      handleClick(e);
    },
    onTouchEnd: (e: React.TouchEvent) => {
      clear();
      handleClick(e);
    },
    onMouseLeave: () => clear(),
  };
};