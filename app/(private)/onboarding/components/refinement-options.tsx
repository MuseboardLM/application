// app/(private)/onboarding/components/refinement-options.tsx

"use client";

import { motion } from "framer-motion";
import { Lightbulb, Heart, Target, Zap } from "lucide-react";

interface RefinementOptionsProps {
  mission: string;
  onRefine: (prompt: string) => void;
  isRefining: boolean;
}

const refinements = [
  { 
    label: "More ambitious", 
    icon: Zap,
    prompt: "Make this mission statement more ambitious and inspiring",
    description: "Add boldness and scale"
  },
  { 
    label: "More personal", 
    icon: Heart,
    prompt: "Make this mission statement more personal and heartfelt",
    description: "Make it feel more authentic"
  },
  { 
    label: "More specific", 
    icon: Target,
    prompt: "Make this mission statement more specific and actionable",
    description: "Add concrete details"
  },
  { 
    label: "Simpler", 
    icon: Lightbulb,
    prompt: "Make this mission statement simpler and more concise",
    description: "Focus on clarity"
  }
];

export function RefinementOptions({ mission, onRefine, isRefining }: RefinementOptionsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="space-y-6 md:space-y-8"
    >
      <div className="text-center space-y-2">
        <p className="text-white/80 font-medium">Not quite right? Refine it:</p>
        <p className="text-white/50 text-sm">Shadow can adjust the tone, focus, or style to match your vision</p>
      </div>
      
      {/* Mobile-optimized refinement grid */}
      <div className="space-y-3 sm:grid sm:grid-cols-2 sm:gap-3 sm:space-y-0 lg:grid-cols-4">
        {refinements.map((refinement, index) => {
          const Icon = refinement.icon;
          return (
            <motion.button
              key={refinement.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 + index * 0.1 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onRefine(`Current mission: "${mission}". ${refinement.prompt}`)}
              disabled={isRefining}
              className="w-full group p-4 rounded-lg border border-white/20 bg-white/5 hover:bg-white/10 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-left backdrop-blur-sm"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-white/20 to-white/10 flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0">
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <span className="font-medium text-white text-sm">{refinement.label}</span>
              </div>
              <p className="text-xs text-white/60 leading-relaxed">{refinement.description}</p>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}