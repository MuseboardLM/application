// components/ui/badge.tsx

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  onRemove?: () => void;
}

function Badge({ className, variant, onRemove, children, ...props }: BadgeProps) {
  const handleRemoveClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation(); // Prevent parent onClick from firing
    if (onRemove) {
      onRemove();
    }
  };

  // Keep the original variant, don't force destructive when onRemove is present
  const finalVariant = variant;

  return (
    <div className={cn(badgeVariants({ variant: finalVariant }), className)} {...props}>
      {children}
      {onRemove && (
        <button
          onClick={handleRemoveClick}
          className="ml-1.5 -mr-1 h-3 w-3 rounded-full hover:bg-background/20 flex items-center justify-center transition-colors outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
          aria-label={`Remove ${children}`}
        >
          <X className="h-2 w-2" />
        </button>
      )}
    </div>
  );
}

export { Badge, badgeVariants };