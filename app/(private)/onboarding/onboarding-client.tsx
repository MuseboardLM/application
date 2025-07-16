// app/(private)/onboarding/onboarding-client.tsx

"use client";

import { useState, useTransition } from "react";
import { User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { MissionFlow } from "./mission-flow";
import { InspirationStep } from "./inspiration-step";
import { ProgressIndicator } from "./components/progress-indicator";
import { saveInspirationAndCompleteOnboardingAction } from "@/lib/actions/onboarding";

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

  // --- HANDLERS ---

  const handleMissionComplete = (missionStatement: string) => {
    setMission(missionStatement);
    setStep("inspiration");
  };

  const handleInspirationComplete = async (heroes: string[], interests: string[]) => {
    startTransition(async () => {
      const result = await saveInspirationAndCompleteOnboardingAction(heroes, interests);
      
      if (result.success && result.data) {
        toast.success("🎉 Welcome to your Museboard!", {
          description: `${result.data.items_added} pieces of inspiration curated just for you.`,
          duration: 4000,
        });
        
        setTimeout(() => router.push('/museboard'), 2000);
      } else {
        toast.error("Setup Failed", { description: result.error });
      }
    });
  };

  // --- RENDER ---

  return (
    <div className="min-h-screen w-full flex flex-col p-4 md:p-8 relative">
      <ProgressIndicator currentStep={step} />
      <div className="flex-1 flex flex-col items-center justify-start">
        <AnimatePresence mode="wait">
          {step === "mission" && (
            <motion.div
              key="mission"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="w-full"
            >
              <MissionFlow onComplete={handleMissionComplete} />
            </motion.div>
          )}
          {step === "inspiration" && (
            <motion.div
              key="inspiration"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="w-full"
            >
              <InspirationStep
                mission={mission}
                onComplete={handleInspirationComplete}
                isSubmitting={isPending}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}