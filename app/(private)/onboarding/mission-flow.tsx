// app/(private)/onboarding/mission-flow.tsx

"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Crop } from "lucide-react";
import IridescentIcon from "@/components/ui/iridescent-icon";
import {
  generateMissionAction,
  refineMissionAction,
  saveMissionAction
} from "@/lib/actions/onboarding";

import { LoadingSpinner } from "@/components/ui/loading-spinner";

// Import the new components
import { MissionInput } from "./components/mission-input";
import { MissionResult } from "./components/mission-result";

type MissionFlowState = 
  | "input"
  | "generating"
  | "result"
  | "refining"
  | "saving"
  | "complete";

interface MissionFlowProps {
  onComplete: (mission: string) => void;
}

export function MissionFlow({ onComplete }: MissionFlowProps) {
  const [flowState, setFlowState] = useState<MissionFlowState>("input");
  const [generatedMission, setGeneratedMission] = useState("");

  const handleGenerateMission = async (userInput: string) => {
    if (!userInput.trim()) return;
    
    setFlowState("generating");
    
    try {
      const result = await generateMissionAction(userInput.trim());
      
      if (result.success) {
        setGeneratedMission(result.data.mission);
        setFlowState("result");
      } else {
        toast.error("Failed to generate mission", { description: result.error });
        setFlowState("input");
      }
    } catch (error) {
      toast.error("Failed to generate mission");
      setFlowState("input");
    }
  };

  const handleRefineMission = async (refinementPrompt: string) => {
    setFlowState("refining");
    
    try {
      const result = await refineMissionAction(refinementPrompt);
      
      if (result.success) {
        setGeneratedMission(result.data.mission);
        setFlowState("result");
        toast.success("Mission refined! ✨");
      } else {
        toast.error("Failed to refine mission", { description: result.error });
        setFlowState("result");
      }
    } catch (error) {
      toast.error("Failed to refine mission");
      setFlowState("result");
    }
  };

  const handleAcceptMission = async () => {
    setFlowState("saving");
    
    try {
      const result = await saveMissionAction(generatedMission);
      
      if (result.success) {
        toast.success("Mission saved! ✨", {
          description: "Next: Let's find your inspiration sources...",
        });
        onComplete(generatedMission);
      } else {
        toast.error("Failed to save mission", { description: result.error });
        setFlowState("result");
      }
    } catch (error) {
      toast.error("Failed to save mission");
      setFlowState("result");
    }
  };

  const getLoadingMessage = () => {
    switch (flowState) {
      case "generating":
        return "Crafting your mission statement...";
      case "refining":
        return "Refining your mission...";
      case "saving":
        return "Saving your mission...";
      default:
        return "Processing...";
    }
  };

  return (
    <div className="w-full min-h-screen px-4 py-6 md:py-8 overflow-y-auto">
      {/* Enhanced header */}
      <AnimatePresence>
        {flowState === "input" && (
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.5 }}
            className="text-center space-y-6 mb-8 md:mb-12"
          >
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ 
                delay: 0.2, 
                type: "spring", 
                stiffness: 200,
                damping: 15
              }}
              className="inline-block"
            >
              <IridescentIcon icon={Crop} className="h-12 w-12 md:h-16 md:w-16" />
            </motion.div>
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-3xl md:text-4xl lg:text-6xl font-bold tracking-tighter bg-gradient-to-r from-white via-white/95 to-white/85 bg-clip-text text-transparent"
            >
              What's Your Mission?
            </motion.h1>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content container with mobile-friendly scrolling */}
      <div className="flex flex-col items-center justify-start pb-8">
        <AnimatePresence mode="wait">
          {flowState === "input" && (
            <MissionInput
              key="input"
              onSubmit={handleGenerateMission}
              disabled={false}
            />
          )}
          
          {(flowState === "generating" || flowState === "refining" || flowState === "saving") && (
            <LoadingSpinner
              key="loading"
              message={getLoadingMessage()}
              variant="mission"
            />
          )}
          
          {flowState === "result" && (
            <MissionResult
              key="result"
              mission={generatedMission}
              onRefine={handleRefineMission}
              onAccept={handleAcceptMission}
              isRefining={flowState === "refining"}
              isSaving={flowState === "saving"}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}