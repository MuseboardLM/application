// components/ui/shadow-message.tsx

"use client";

import { motion } from "framer-motion";
import { Brain } from "lucide-react";
import { cn } from "@/lib/utils";

interface ShadowMessageProps {
  message: string;
  className?: string;
  showAvatar?: boolean;
  delay?: number;
}

export function ShadowMessage({ 
  message, 
  className, 
  showAvatar = true,
  delay = 0 
}: ShadowMessageProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.5, 
        delay,
        ease: "easeOut" 
      }}
      className={cn("flex items-start gap-3", className)}
    >
      {showAvatar && (
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 border border-primary/20 shrink-0">
          <Brain className="w-4 h-4 text-primary" />
        </div>
      )}
      
      <div className="flex-1">
        <div className="bg-card border rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-medium text-primary">Shadow</span>
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          </div>
          
          <p className="text-sm text-muted-foreground leading-relaxed">
            {message}
          </p>
        </div>
      </div>
    </motion.div>
  );
}