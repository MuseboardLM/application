// app/(private)/onboarding/components/mission-input.tsx

"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { ChatInput } from "@/components/ui/chat-input";

const MISSION_PLACEHOLDERS = [
  "e.g. I dream of creating products that make people's lives easier...",
  "e.g. I want to start a business that gives me freedom and flexibility...",
  "e.g. I want to launch a startup that disrupts an industry I care about...",
  "e.g. I want to develop the discipline to achieve my biggest goals...",
  "e.g. I want to build habits that make me healthier and more productive...",
  "e.g. I dream of creating wealth that supports my family's future...",
  "e.g. I hope to earn enough to give generously to causes I believe in...",
  "e.g. I dream of creating a business that makes the world better...",
  "e.g. I want to build something that outlasts me and creates lasting value...",
  "e.g. I dream of inspiring others to pursue their entrepreneurial dreams...",
];

interface MissionInputProps {
  onSubmit: (input: string) => void;
  disabled: boolean;
}

export function MissionInput({ onSubmit, disabled }: MissionInputProps) {
  const [charCount, setCharCount] = useState(0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
      className="space-y-8 w-full max-w-3xl mx-auto"
    >
      {/* Enhanced header with better visual hierarchy */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-center space-y-4"
      >
        <h3 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-white via-white/90 to-white/80 bg-clip-text text-transparent">
          Your North Star
        </h3>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
          What are the dreams that keep you up at night? The goals that make your heart race?
          Share your deepest ambitions, and Shadow will craft them into a powerful mission statement.
        </p>
      </motion.div>

      {/* Enhanced input area with better visual treatment */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="relative"
      >
        <div className="absolute -inset-1 bg-gradient-to-r from-sky-400/20 via-purple-400/20 to-rose-400/20 rounded-2xl blur-lg opacity-60" />
        <div className="relative">
          <ChatInput
            placeholder="Share your dreams and goals. What must you absolutely accomplish?"
            animatedPlaceholders={MISSION_PLACEHOLDERS}
            onSubmit={onSubmit}
            disabled={disabled}
            rows={4}
            onChange={(e) => setCharCount(e.target.value.length)}
            typingSpeed={40}
            pauseDuration={3000}
            className="min-h-[120px] text-base leading-relaxed"
          />
          {charCount > 0 && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute -bottom-8 right-4 text-xs text-muted-foreground/60"
            >
              {charCount}/500
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Enhanced call-to-action section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="text-center py-8"
      >
        <motion.div 
          animate={{ 
            rotate: [0, 5, -5, 0],
            scale: [1, 1.05, 1]
          }}
          transition={{ 
            duration: 4, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
          className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary/20 via-purple-500/20 to-sky-500/20 flex items-center justify-center backdrop-blur-sm border border-white/10"
        >
          <Sparkles className="w-10 h-10 text-white" />
        </motion.div>
        <div className="space-y-2">
          <p className="text-white/90 font-medium">Share your ambitions.</p>
          <p className="text-muted-foreground">Shadow AI will craft your mission.</p>
        </div>
      </motion.div>
    </motion.div>
  );
}