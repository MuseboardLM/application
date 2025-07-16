// app/(private)/onboarding/components/custom-input-toggle.tsx

"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus } from "lucide-react";
import { ChatInput } from "@/components/ui/chat-input";

interface CustomInputToggleProps {
  onAdd: (input: string) => void;
  placeholder: string;
  disabled?: boolean;
}

export function CustomInputToggle({ onAdd, placeholder, disabled }: CustomInputToggleProps) {
  const [showInput, setShowInput] = useState(false);

  const handleSubmit = (input: string) => {
    onAdd(input);
    setShowInput(false);
  };

  return (
    <div className="text-center">
      <AnimatePresence mode="wait">
        {showInput ? (
          <motion.div
            key="input"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-3"
          >
            <ChatInput
              placeholder={placeholder}
              onSubmit={handleSubmit}
              disabled={disabled}
              rows={1}
            />
            <button
              onClick={() => setShowInput(false)}
              className="text-sm text-muted-foreground hover:text-foreground cursor-pointer"
            >
              Cancel
            </button>
          </motion.div>
        ) : (
          <motion.button
            key="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowInput(true)}
            disabled={disabled}
            className="flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-secondary/30 hover:bg-secondary/50 transition-all cursor-pointer mx-auto disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            Add your own
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}