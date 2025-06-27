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
        // The glow effect.
        "glow-drop-shadow",

        // The base styling for a solid background.
        "relative rounded-2xl border border-border/30 p-6 sm:p-8 bg-card",

        className
      )}
    >
      {/* The form content */}
      {children}
    </div>
  );
};