// app/(private)/onboarding/components/progress-indicator.tsx

"use client";

import { motion } from "framer-motion";
import { Target, Heart } from "lucide-react";

type OnboardingStep = "mission" | "inspiration" | "complete";

interface ProgressIndicatorProps {
  currentStep: OnboardingStep;
}

const steps = [
  { key: "mission" as const, label: "Mission", icon: Target },
  { key: "inspiration" as const, label: "Inspiration", icon: Heart }
];

export function ProgressIndicator({ currentStep }: ProgressIndicatorProps) {
  const currentIndex = steps.findIndex(step => step.key === currentStep);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-center gap-4 mb-4"
    >
      <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted/30 border">
        <div className="text-xs font-medium text-muted-foreground">
          Step {currentIndex + 1} of {steps.length}
        </div>
        <div className="w-1 h-1 rounded-full bg-muted-foreground/40" />
        <div className="text-xs font-medium capitalize text-foreground">
          {steps[currentIndex]?.label}
        </div>
      </div>
    </motion.div>
  );
}