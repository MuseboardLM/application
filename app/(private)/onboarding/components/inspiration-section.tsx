// app/(private)/onboarding/components/inspiration-section.tsx

"use client";

import { Loader2 } from "lucide-react";
import { SelectionChip } from "./selection-chip";
import { CustomInputToggle } from "./custom-input-toggle";

interface InspirationSectionProps {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  suggestions: Array<{ name?: string; category?: string }>;
  selected: string[];
  onToggle: (item: string) => void;
  onCustomAdd: (input: string) => void;
  placeholder: string;
  isLoading: boolean;
  selectedCount: number;
}

export function InspirationSection({
  title,
  icon: Icon,
  suggestions,
  selected,
  onToggle,
  onCustomAdd,
  placeholder,
  isLoading,
  selectedCount
}: InspirationSectionProps) {
  const suggestionNames = suggestions.map(s => s.name || s.category).filter(Boolean).slice(0, 6);

  return (
    <div className="flex-1 space-y-6">
      {/* Section Header */}
      <div className="text-center">
        <div className="relative inline-block">
          <div className="w-12 h-12 mx-auto rounded-full bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center mb-3">
            <Icon className="w-6 h-6 text-primary" />
          </div>
          {selectedCount > 0 && (
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
              {selectedCount}
            </div>
          )}
        </div>
        <h3 className="text-xl font-semibold">{title}</h3>
      </div>

      {/* Suggestions */}
      <div className="relative">
        <div className="absolute -inset-1 bg-gradient-to-r from-sky-400/20 via-purple-400/20 to-rose-400/20 rounded-xl blur-md opacity-50" />
        <div className="relative bg-gradient-to-br from-card via-card/90 to-card/70 rounded-xl p-6 shadow-2xl ring-1 ring-border/50 min-h-[200px] flex items-center justify-center">
          {isLoading ? (
            <div className="flex flex-col items-center gap-3 text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span className="text-sm">Shadow is thinking...</span>
            </div>
          ) : (
            <div className="w-full space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                Shadow's suggestions for you:
              </p>
              <div className="grid grid-cols-2 gap-3">
                {suggestionNames.map((suggestion) => (
                  <SelectionChip
                    key={suggestion}
                    selected={selected.includes(suggestion)}
                    onClick={() => onToggle(suggestion)}
                  >
                    {suggestion}
                  </SelectionChip>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Custom */}
      <CustomInputToggle
        onAdd={onCustomAdd}
        placeholder={placeholder}
        disabled={isLoading}
      />
    </div>
  );
}