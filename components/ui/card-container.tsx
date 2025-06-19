// components/ui/card-container.tsx

import { cn } from "@/lib/utils";
import React from "react";

interface CardContainerProps {
  children: React.ReactNode;
  className?: string;
}

export const CardContainer = ({ children, className }: CardContainerProps) => {
  return (
    <div
      className={cn(
        // The glow effect remains, using the robust drop-shadow filter.
        "glow-drop-shadow",

        // Base styling: relative position, rounded corners, border, and padding.
        "relative rounded-2xl border border-border/30 p-6 sm:p-8",

        // REMOVED: "backdrop-blur-sm" and "bg-card/50" (the glassmorphism).
        // ADDED: A solid background using the theme's card color.
        "bg-card",

        // We'll keep the subtle inner background gradient for a premium touch.
        "before:absolute before:inset-0 before:-z-10 before:rounded-[inherit] before:bg-gradient-to-br before:from-primary/10 before:via-primary/5 before:to-background",

        className
      )}
    >
      {/* The top-down overlay also remains, as it adds nice depth. */}
      <div className="absolute inset-0 rounded-[inherit] bg-gradient-to-t from-background/20 to-transparent pointer-events-none" />

      {/* The form content */}
      {children}
    </div>
  );
};
