// app/(private)/onboarding/onboarding-client.tsx

"use client";

import { useState, useTransition } from "react";
import { User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Crop, Sparkles, Loader2 } from "lucide-react";
import { ChatInput } from "@/components/ui/chat-input";
import IridescentIcon from "@/components/ui/iridescent-icon";
import { InspirationStep } from "./inspiration-step"; // New component import
import {
  saveMissionAction,
  saveInspirationAndCompleteOnboardingAction
} from "@/lib/actions/onboarding";

// Define the onboarding steps
type OnboardingStep = "mission" | "inspiration" | "complete";

interface OnboardingClientProps {
  user: User;
  existingMission?: { mission_statement: string } | null;
}

export function OnboardingClient({ user, existingMission }: OnboardingClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [step, setStep] = useState<OnboardingStep>(
    existingMission?.mission_statement ? "inspiration" : "mission"
  );
  const [mission, setMission] = useState(existingMission?.mission_statement || "");
  const [isProcessingMission, setIsProcessingMission] = useState(false);

  // --- HANDLERS ---

  // Step 1: Handle mission submission
  const handleMissionSubmit = async (userInput: string) => {
    if (!userInput.trim()) return;
    setIsProcessingMission(true);

    // This now calls a server action instead of fetch
    const result = await saveMissionAction(userInput.trim());

    if (result.success && result.data) {
      setMission(result.data.mission);
      toast.success("Mission Crafted ✨", {
        description: "A strong foundation for your journey.",
      });
      setStep("inspiration"); // Move to the next step
    } else {
      toast.error("Failed to save mission", { description: result.error });
    }
    setIsProcessingMission(false);
  };
  
  // Step 2: Handle final submission
  const handleInspirationComplete = async (heroes: string[], interests: string[]) => {
    startTransition(async () => {
      const result = await saveInspirationAndCompleteOnboardingAction(heroes, interests);
      
      if (result.success && result.data) {
        toast.success("🎉 Welcome to your Museboard!", {
          description: `${result.data.items_added} pieces of inspiration curated just for you.`,
          duration: 4000,
        });
        
        // Redirect to the museboard after a short delay
        setTimeout(() => router.push('/museboard'), 2000);
      } else {
        toast.error("Setup Failed", { description: result.error });
      }
    });
  };

  // --- RENDER LOGIC ---

  const renderHeader = () => (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center space-y-4 mb-12"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
        className="inline-block"
      >
        <IridescentIcon icon={step === 'mission' ? Crop : Sparkles} className="h-14 w-14" />
      </motion.div>
      <h1 className="text-4xl md:text-5xl font-bold tracking-tighter">
        {step === 'mission' ? "Let's Define Your Mission" : "Find Your Inspiration"}
      </h1>
    </motion.div>
  );

  const renderMissionStep = () => (
    <motion.div
      key="mission-step"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full max-w-2xl mx-auto space-y-6"
    >
      <div className="text-center">
        <p className="text-muted-foreground text-lg">
          What is the core purpose that drives you? Share your goals or dreams.
        </p>
      </div>
      <div className="relative">
        <ChatInput
          placeholder="e.g., To build tools that empower creators..."
          onSubmit={handleMissionSubmit}
          disabled={isProcessingMission}
          rows={3}
        />
        {isProcessingMission && (
          <div className="absolute inset-0 bg-background/80 flex items-center justify-center rounded-lg">
            <div className="flex items-center gap-3">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground">Shadow is crafting...</span>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 md:p-8">
      {renderHeader()}
      <AnimatePresence mode="wait">
        {step === "mission" && renderMissionStep()}
        {step === "inspiration" && (
          <InspirationStep
            mission={mission}
            onComplete={handleInspirationComplete}
            isSubmitting={isPending}
          />
        )}
      </AnimatePresence>
    </div>
  );
}