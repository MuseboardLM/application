// app/(private)/onboarding/components/selection-chip.tsx

"use client";

import { cn } from "@/lib/utils";

interface SelectionChipProps {
  children: React.ReactNode;
  selected?: boolean;
  onClick?: () => void;
  disabled?: boolean;
}

export function SelectionChip({ 
  children, 
  selected, 
  onClick,
  disabled 
}: SelectionChipProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50",
        selected 
          ? "bg-white/10 border border-white/30 text-white" 
          : "bg-secondary/30 border border-border/50 hover:bg-secondary/50 hover:border-white/20"
      )}
    >
      {children}
    </button>
  );
}