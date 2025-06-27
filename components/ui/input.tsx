// components/ui/input.tsx

import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          // --- THIS IS THE CHANGE ---
          // REMOVED: "border-border"
          // ADDED: "border-primary/20" to apply a subtle, lighter border
          // using your theme's primary color at 20% opacity.
          "flex h-10 w-full rounded-md border border-primary/10 bg-input px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",

          // The rest of the classes remain the same.
          "shadow-inner shadow-black/40",
          "transition-colors",
          "focus-visible:border-primary/50", // The focus state will now smoothly transition from 20% to 50% opacity.

          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };