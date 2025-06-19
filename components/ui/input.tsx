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
          "flex h-10 w-full rounded-md border-transparent bg-input px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",

          // --- THE UPGRADE ---
          // 1. A subtle inner shadow to give the input an "inset" look.
          "shadow-inner shadow-black/40",

          // 2. A smooth transition for a polished focus effect.
          "transition-colors",

          // 3. A brighter border on focus for clear user feedback.
          // This replaces the default blue/white ring for a more integrated look.
          "focus-visible:border-primary/50",

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
