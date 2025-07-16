// app/(private)/onboarding/mission-flow.tsx

"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Crop, Sparkles, RefreshCw, ChevronRight, Edit3 } from "lucide-react";
import { ChatInput } from "@/components/ui/chat-input";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import IridescentIcon from "@/components/ui/iridescent-icon";
import {
  generateMissionAction,
  refineMissionAction,
  saveMissionAction
} from "@/lib/actions/onboarding";

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

// Single state machine for the mission flow
type MissionFlowState = 
  | "input"          // User is typing their mission
  | "result"         // Showing the generated mission
  | "refining"       // AI is refining the mission
  | "saving"         // Saving the mission to database
  | "complete";      // Mission saved, moving to next step

interface MissionFlowProps {
  onComplete: (mission: string) => void;
}

// Mission input component
const MissionInput = ({ 
  onSubmit, 
  disabled 
}: { 
  onSubmit: (input: string) => void, 
  disabled: boolean 
}) => {
  const [charCount, setCharCount] = useState(0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-8"
    >
      <div className="text-center">
        <h3 className="text-lg font-medium mb-2">Your North Star</h3>
        <p className="text-muted-foreground">
          What are your dreams and goals?
        </p>
      </div>

      <div className="relative max-w-2xl mx-auto">
        <ChatInput
          placeholder="Share your dreams and goals. What must you absolutely achieve?"
          animatedPlaceholders={MISSION_PLACEHOLDERS}
          onSubmit={onSubmit}
          disabled={disabled}
          rows={3}
          onChange={(e) => setCharCount(e.target.value.length)}
          typingSpeed={40}
          pauseDuration={3000}
        />
        {charCount > 0 && (
          <div className="absolute -bottom-6 right-0 text-xs text-muted-foreground">
            {charCount}/500
          </div>
        )}
      </div>

      <div className="text-center py-8">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center">
          <Sparkles className="w-8 h-8 text-primary" />
        </div>
        <p className="text-muted-foreground">Share your dreams, Shadow will craft your mission...</p>
      </div>
    </motion.div>
  );
};

// Mission result component
const MissionResult = ({ 
  mission, 
  onRefine, 
  onAccept, 
  isRefining,
  isSaving 
}: { 
  mission: string, 
  onRefine: (prompt: string) => void, 
  onAccept: () => void,
  isRefining: boolean,
  isSaving: boolean 
}) => {
  const [displayedMission, setDisplayedMission] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [editedMission, setEditedMission] = useState(mission);
  const [refineMode, setRefineMode] = useState(false);

  // Typewriter effect
  useEffect(() => {
    if (mission) {
      setDisplayedMission("");
      setEditedMission(mission);
      
      setTimeout(() => {
        let index = 0;
        const timer = setInterval(() => {
          setDisplayedMission(mission.slice(0, index));
          index++;
          if (index > mission.length) clearInterval(timer);
        }, 25);
      }, 200);
    }
  }, [mission]);

  const handleDirectEdit = () => {
    setDisplayedMission(editedMission);
    setEditMode(false);
    toast.success("Mission updated! ✨");
  };

  const handleCustomRefine = (input: string) => {
    if (input.trim()) {
      onRefine(`Current mission: "${mission}". User feedback: ${input}`);
      setRefineMode(false);
    }
  };

  const refinements = [
    { label: "More ambitious", prompt: "Make this mission statement more ambitious and inspiring" },
    { label: "More personal", prompt: "Make this mission statement more personal and heartfelt" },
    { label: "More specific", prompt: "Make this mission statement more specific and actionable" },
    { label: "Simpler", prompt: "Make this mission statement simpler and more concise" }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Mission display */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="relative group"
      >
        <div className="absolute -inset-1 bg-gradient-to-r from-sky-400/30 via-purple-400/30 to-rose-400/30 rounded-xl blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        <div className="relative bg-gradient-to-br from-card via-card/90 to-card/70 rounded-xl p-6 shadow-2xl ring-1 ring-border/50">
          <div className="flex items-start gap-4">
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
                        setEditedMission(mission);
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
                    {displayedMission.length < mission.length && (
                      <motion.span
                        animate={{ opacity: [1, 0, 1] }}
                        transition={{ repeat: Infinity, duration: 1 }}
                        className="inline-block w-1.5 h-7 bg-sky-400 ml-1 rounded-full"
                      />
                    )}
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
          {/* Quick refinements */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-3"
          >
            <p className="text-center text-sm text-muted-foreground">Quick refinements:</p>
            <div className="flex flex-wrap justify-center gap-2">
              {refinements.map((refinement) => (
                <motion.button
                  key={refinement.label}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onRefine(`Current mission: "${mission}". ${refinement.prompt}`)}
                  disabled={isRefining}
                  className="px-3 py-1.5 text-xs rounded-full border border-border bg-secondary/30 hover:bg-secondary/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {refinement.label}
                </motion.button>
              ))}
            </div>
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

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex justify-center gap-3"
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
              disabled={isSaving}
              className="px-6 py-2 text-lg font-semibold rounded-xl bg-white text-black hover:bg-white/90 transition-all duration-200 shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] disabled:opacity-50 cursor-pointer"
            >
              {isSaving ? "Saving..." : "Continue"}
              <ChevronRight className="w-5 h-5 ml-2 inline" />
            </motion.button>
          </motion.div>

          {/* Next step preview */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-center"
          >
            <p className="text-sm text-muted-foreground">
              Next: We'll find heroes and interests that inspire you
            </p>
          </motion.div>
        </>
      )}
    </motion.div>
  );
};

export function MissionFlow({ onComplete }: MissionFlowProps) {
  // Single state machine
  const [flowState, setFlowState] = useState<MissionFlowState>("input");
  const [generatedMission, setGeneratedMission] = useState("");

  // --- MISSION HANDLERS ---

  const handleGenerateMission = async (userInput: string) => {
    if (!userInput.trim()) return;
    
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

  // --- RENDER ---

  return (
    <div className="w-full max-w-3xl mx-auto px-4">
      {/* Header */}
      <AnimatePresence>
        {flowState === "input" && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
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
              What's Your Mission?
            </h1>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content container */}
      <div className="min-h-[400px] flex items-center justify-center">
        <AnimatePresence mode="wait">
          {flowState === "input" && (
            <MissionInput
              key="input"
              onSubmit={handleGenerateMission}
              disabled={false}
            />
          )}
          
          {flowState === "refining" && (
            <LoadingSpinner
              key="refining"
              message="Refining your mission statement"
            />
          )}
          
          {flowState === "result" && (
            <MissionResult
              key="result"
              mission={generatedMission}
              onRefine={handleRefineMission}
              onAccept={handleAcceptMission}
              isRefining={false}
              isSaving={false}
            />
          )}
          
          {flowState === "saving" && (
            <LoadingSpinner
              key="saving"
              message="Saving your mission"
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}