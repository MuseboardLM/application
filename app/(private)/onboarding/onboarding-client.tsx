// app/(private)/onboarding/onboarding-client.tsx

"use client";

import { useState, useTransition, useEffect } from "react";
import { User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Crop, Sparkles, Loader2, RefreshCw, Check, ChevronRight, Edit3, Target, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChatInput } from "@/components/ui/chat-input";
import IridescentIcon from "@/components/ui/iridescent-icon";
import { InspirationStep } from "./inspiration-step";
import {
  saveMissionAction,
  generateMissionAction,
  refineMissionAction,
  saveInspirationAndCompleteOnboardingAction
} from "@/lib/actions/onboarding";

type OnboardingStep = "mission" | "inspiration" | "complete";

interface OnboardingClientProps {
  user: User;
  existingMission?: { mission_statement: string } | null;
}

// Progress indicator component
const ProgressIndicator = ({ currentStep }: { currentStep: OnboardingStep }) => {
  const steps = [
    { key: "mission", label: "Mission", icon: Target },
    { key: "inspiration", label: "Inspiration", icon: Heart }
  ];
  
  const currentIndex = steps.findIndex(step => step.key === currentStep);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-center gap-4 mb-8"
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
};

// Quick refinement buttons component
const QuickRefinementButtons = ({ onRefine, disabled }: { onRefine: (prompt: string) => void, disabled: boolean }) => {
  const refinements = [
    { label: "More ambitious", prompt: "Make this mission statement more ambitious and inspiring" },
    { label: "More personal", prompt: "Make this mission statement more personal and heartfelt" },
    { label: "More specific", prompt: "Make this mission statement more specific and actionable" },
    { label: "Simpler", prompt: "Make this mission statement simpler and more concise" }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-wrap justify-center gap-2"
    >
      {refinements.map((refinement) => (
        <motion.button
          key={refinement.label}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onRefine(refinement.prompt)}
          disabled={disabled}
          className="px-3 py-1.5 text-xs rounded-full border border-border bg-secondary/30 hover:bg-secondary/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {refinement.label}
        </motion.button>
      ))}
    </motion.div>
  );
};

export function OnboardingClient({ user, existingMission }: OnboardingClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [step, setStep] = useState<OnboardingStep>(
    existingMission?.mission_statement ? "inspiration" : "mission"
  );
  const [mission, setMission] = useState(existingMission?.mission_statement || "");
  const [isGeneratingMission, setIsGeneratingMission] = useState(false);
  const [generatedMission, setGeneratedMission] = useState("");
  const [displayedMission, setDisplayedMission] = useState("");
  const [isRefining, setIsRefining] = useState(false);
  const [showMission, setShowMission] = useState(false);
  const [refineMode, setRefineMode] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editedMission, setEditedMission] = useState("");
  const [charCount, setCharCount] = useState(0);

  // Hide header when mission is shown
  const shouldHideHeader = showMission && step === "mission";

  // Typewriter effect for mission - with delay for smooth transition
  useEffect(() => {
    if (generatedMission && showMission) {
      setDisplayedMission("");
      setEditedMission(generatedMission);
      
      // Add a delay before starting the typewriter effect
      setTimeout(() => {
        let index = 0;
        const timer = setInterval(() => {
          setDisplayedMission(generatedMission.slice(0, index));
          index++;
          if (index > generatedMission.length) clearInterval(timer);
        }, 25); // Slightly faster typing for smoother feel
      }, 300); // 300ms delay to let other animations settle
    }
  }, [generatedMission, showMission]);

  // --- MISSION GENERATION ---

  const handleGenerateMission = async (userInput: string) => {
    if (!userInput.trim()) return;
    
    // Immediately show loading state
    setIsGeneratingMission(true);
    
    const result = await generateMissionAction(userInput.trim());
    
    if (result.success) {
      setGeneratedMission(result.data.mission);
      
      // Small delay before showing mission to let loading animation finish gracefully
      setTimeout(() => {
        setIsGeneratingMission(false);
        setShowMission(true);
      }, 500);
    } else {
      toast.error("Failed to generate mission", { description: result.error });
      setIsGeneratingMission(false);
    }
  };

  const handleQuickRefine = async (refinementPrompt: string) => {
    if (!generatedMission) return;
    setIsRefining(true);
    
    const combinedInput = `Current mission: "${generatedMission}". ${refinementPrompt}`;
    const result = await refineMissionAction(combinedInput);
    
    if (result.success) {
      setGeneratedMission(result.data.mission);
      setShowMission(true);
      toast.success("Mission refined! ✨");
    } else {
      toast.error("Failed to refine mission", { description: result.error });
    }
    
    setIsRefining(false);
  };

  const handleCustomRefine = async (input: string) => {
    if (!generatedMission || !input.trim()) return;
    setIsRefining(true);
    
    const combinedInput = `Current mission: "${generatedMission}". User feedback: ${input}`;
    const result = await refineMissionAction(combinedInput);
    
    if (result.success) {
      setGeneratedMission(result.data.mission);
      setShowMission(true);
      setRefineMode(false);
      toast.success("Mission refined! ✨");
    } else {
      toast.error("Failed to refine mission", { description: result.error });
    }
    
    setIsRefining(false);
  };

  const handleDirectEdit = () => {
    setGeneratedMission(editedMission);
    setEditMode(false);
    toast.success("Mission updated! ✨");
  };

  const handleAcceptMission = async () => {
    if (!generatedMission) return;
    
    setIsGeneratingMission(true);
    const result = await saveMissionAction(generatedMission);
    
    if (result.success) {
      setMission(generatedMission);
      toast.success("Mission saved! ✨", {
        description: "Next: Let's find your inspiration sources...",
      });
      setStep("inspiration");
    } else {
      toast.error("Failed to save mission", { description: result.error });
    }
    
    setIsGeneratingMission(false);
  };

  // --- INSPIRATION COMPLETION ---

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

  // --- UI COMPONENTS ---

  const renderHeader = () => (
    <AnimatePresence>
      {!shouldHideHeader && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.5, ease: "easeInOut" }} // Slower, smoother exit
          className="text-center space-y-4 mb-12"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
            className="inline-block"
          >
            <IridescentIcon icon={Crop} className="h-14 w-14" />
          </motion.div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tighter">
            What Is Your Life's Mission?
          </h1>
        </motion.div>
      )}
    </AnimatePresence>
  );

  const MissionStates = {
    Idle: () => (
      <motion.div
        initial={{ opacity: 1 }}
        exit={{ opacity: 0, transition: { duration: 0.3 } }}
        className="text-center py-8"
      >
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center">
          <Sparkles className="w-8 h-8 text-primary" />
        </div>
        <p className="text-muted-foreground">Share your dreams, Shadow will craft your mission...</p>
      </motion.div>
    ),
    
    Generating: () => (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.3 } }}
        className="text-center py-16 space-y-6"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
          className="inline-block"
        >
          <IridescentIcon icon={Crop} className="h-16 w-16" />
        </motion.div>
        <div className="space-y-2">
          <p className="text-lg font-medium">Shadow is crafting your mission statement</p>
          <p className="text-sm text-muted-foreground">This may take a moment...</p>
        </div>
        
        {/* Optional: Add some loading dots animation */}
        <motion.div 
          className="flex justify-center gap-1"
          initial="hidden"
          animate="visible"
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 bg-primary rounded-full"
              variants={{
                hidden: { opacity: 0.3 },
                visible: { opacity: 1 }
              }}
              transition={{
                repeat: Infinity,
                duration: 0.8,
                delay: i * 0.2,
                repeatType: "reverse"
              }}
            />
          ))}
        </motion.div>
      </motion.div>
    ),
    
    Complete: ({ onAccept }: any) => (
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ 
          duration: 0.5, 
          ease: "easeOut",
          delay: 0.1 // Small delay to ensure smooth sequencing
        }}
        className="space-y-6"
      >
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 250, damping: 20, delay: 0.2 }}
          className="relative group"
        >
          {/* soft glow on hover */}
          <div className="absolute -inset-1 bg-gradient-to-r from-sky-400/30 via-purple-400/30 to-rose-400/30 rounded-xl blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          <div className="relative bg-gradient-to-br from-card via-card/90 to-card/70 rounded-xl p-6 shadow-2xl ring-1 ring-border/50">
            <div className="flex items-start gap-4">
              {/* pulsing icon */}
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-sky-400 to-purple-500 flex items-center justify-center"
              >
                <Sparkles className="w-6 h-6 text-white" />
              </motion.div>

              <div className="flex-1">
                {editMode ? (
                  <div className="space-y-3">
                    <textarea
                      value={editedMission}
                      onChange={(e) => setEditedMission(e.target.value)}
                      className="w-full text-2xl font-semibold leading-snug bg-transparent border border-border rounded-lg p-3 resize-none"
                      rows={3}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleDirectEdit}
                        className="px-3 py-1 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 cursor-pointer"
                      >
                        Save Changes
                      </button>
                      <button
                        onClick={() => {
                          setEditMode(false);
                          setEditedMission(generatedMission);
                        }}
                        className="px-3 py-1 text-sm border border-border rounded-md hover:bg-muted cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-2xl font-semibold leading-snug bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
                      {displayedMission}
                      <motion.span
                        animate={{ opacity: [1, 0, 1] }}
                        transition={{ repeat: Infinity, duration: 1 }}
                        className="inline-block w-1.5 h-7 bg-sky-400 ml-1 rounded-full"
                      />
                    </p>

                    <div className="mt-4 flex items-center gap-2">
                      <button
                        onClick={() => setEditMode(true)}
                        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                      >
                        <Edit3 className="w-3 h-3" />
                        Edit directly
                      </button>
                      <span className="text-muted-foreground">•</span>
                      <span className="text-sm text-muted-foreground">
                        You can always change this later
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {!editMode && (
          <>
            {/* Quick refinement buttons */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="space-y-3"
            >
              <p className="text-center text-sm text-muted-foreground">Quick refinements:</p>
              <QuickRefinementButtons onRefine={handleQuickRefine} disabled={isRefining} />
            </motion.div>

            {/* Custom refinement */}
            <AnimatePresence>
              {refineMode && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-3"
                >
                  <ChatInput
                    placeholder="Describe what you'd like to change..."
                    onSubmit={handleCustomRefine}
                    disabled={isRefining}
                    rows={2}
                  />
                  <div className="flex justify-center">
                    <button
                      onClick={() => setRefineMode(false)}
                      className="text-sm text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Action buttons */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex justify-center gap-3 mt-6"
            >
              {!refineMode && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setRefineMode(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-secondary/30 hover:bg-secondary/50 transition-all cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4" />
                  Custom refine
                </motion.button>
              )}

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onAccept}
                disabled={isGeneratingMission}
                className="px-6 py-2 text-lg font-semibold rounded-xl bg-white text-black hover:bg-white/90 transition-all duration-200 shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                Continue
                <ChevronRight className="w-5 h-5 ml-2 inline" />
              </motion.button>
            </motion.div>

            {/* Next step preview */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-center"
            >
              <p className="text-sm text-muted-foreground">
                Next: We'll find heroes and interests that inspire you
              </p>
            </motion.div>
          </>
        )}
      </motion.div>
    )
  };

  const renderMissionStep = () => (
    <motion.div
      key="mission-step"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="w-full max-w-3xl mx-auto space-y-8 px-4"
    >
      {/* Input section - hidden when generating or mission is shown */}
      <AnimatePresence>
        {!showMission && !isGeneratingMission && (
          <motion.div
            initial={{ opacity: 1, y: 0 }}
            exit={{ 
              opacity: 0, 
              y: -20,
              transition: { duration: 0.3, ease: "easeInOut" }
            }}
          >
            <div className="text-center">
              <h3 className="text-lg font-medium mb-2">Your North Star</h3>
              <p className="text-muted-foreground">
                What are your dreams and goals?
              </p>
            </div>

            <div className="relative mt-8">
              <ChatInput
                placeholder="e.g., To build tools that empower creators..."
                onSubmit={handleGenerateMission}
                disabled={isGeneratingMission}
                rows={3}
                onChange={(e) => setCharCount(e.target.value.length)}
              />
              {charCount > 0 && (
                <div className="absolute -bottom-6 right-0 text-xs text-muted-foreground">
                  {charCount}/500
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mission states with proper overlap */}
      <AnimatePresence mode="wait">
        {!showMission && !isGeneratingMission && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.2 } }}
          >
            <MissionStates.Idle />
          </motion.div>
        )}
        {isGeneratingMission && !showMission && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
          >
            <MissionStates.Generating />
          </motion.div>
        )}
        {showMission && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <MissionStates.Complete onAccept={handleAcceptMission} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );

  return (
    <div className="min-h-screen w-full flex flex-col p-4 md:p-8 relative">
      <ProgressIndicator currentStep={step} />
      <div className="flex-1 flex flex-col items-center justify-start pt-16 md:pt-20">
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
    </div>
  );
}