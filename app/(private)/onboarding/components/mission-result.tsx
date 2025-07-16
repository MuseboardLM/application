// app/(private)/onboarding/components/mission-result.tsx

"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Sparkles, RefreshCw, ChevronRight, Edit3, Target } from "lucide-react";
import { ChatInput } from "@/components/ui/chat-input";
import { RefinementOptions } from "./refinement-options";

interface MissionResultProps {
  mission: string;
  onRefine: (prompt: string) => void;
  onAccept: () => void;
  isRefining: boolean;
  isSaving: boolean;
}

export function MissionResult({ 
  mission, 
  onRefine, 
  onAccept, 
  isRefining,
  isSaving 
}: MissionResultProps) {
  const [displayedMission, setDisplayedMission] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [editedMission, setEditedMission] = useState(mission);
  const [refineMode, setRefineMode] = useState(false);

  // Enhanced typewriter effect
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
        }, 20);
      }, 300);
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
      className="space-y-8 md:space-y-12 w-full max-w-sm sm:max-w-md md:max-w-4xl mx-auto"
    >
      {/* Enhanced mission display with better context */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="relative group"
      >
        {/* Enhanced glow effect */}
        <div className="absolute -inset-2 bg-gradient-to-r from-sky-400/30 via-purple-400/30 to-rose-400/30 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        <div className="relative bg-gradient-to-br from-card/80 via-card/60 to-card/40 rounded-xl md:rounded-2xl p-4 sm:p-6 md:p-8 shadow-2xl ring-1 ring-white/20 backdrop-blur-sm">
          {/* Mission Label */}
          <div className="flex items-center gap-3 mb-4 md:mb-6">
            <div className="flex items-center gap-2 px-2 py-1 md:px-3 md:py-1.5 rounded-full bg-gradient-to-r from-sky-500/20 to-purple-500/20 border border-white/10">
              <Target className="w-3 h-3 md:w-4 md:h-4 text-sky-400" />
              <span className="text-xs md:text-sm font-medium text-white/80">Your Mission</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start gap-4 md:gap-6">
            {/* Enhanced icon with animation */}
            <motion.div
              animate={{ 
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ 
                duration: 3, 
                repeat: Infinity, 
                ease: 'easeInOut' 
              }}
              className="flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-xl md:rounded-2xl bg-gradient-to-br from-sky-400 via-purple-500 to-rose-400 flex items-center justify-center shadow-lg"
            >
              <Sparkles className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-white" />
            </motion.div>

            <div className="flex-1">
              {editMode ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-4"
                >
                  <textarea
                    value={editedMission}
                    onChange={(e) => setEditedMission(e.target.value)}
                    className="w-full text-xl md:text-2xl font-semibold leading-relaxed bg-black/20 border border-white/20 rounded-xl p-4 resize-none text-white placeholder-white/50 focus:border-white/40 focus:outline-none focus:ring-2 focus:ring-white/20"
                    rows={4}
                    placeholder="Edit your mission statement..."
                  />
                  <div className="flex gap-3">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 1.00 }}
                      onClick={handleDirectEdit}
                      className="px-4 py-2 text-sm bg-white text-black rounded-lg hover:bg-white/90 font-medium transition-all shadow-lg cursor-pointer"
                    >
                      Save Changes
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        setEditMode(false);
                        setEditedMission(mission);
                      }}
                      className="px-4 py-2 text-sm border border-white/30 rounded-lg hover:bg-white/10 transition-all cursor-pointer"
                    >
                      Cancel
                    </motion.button>
                  </div>
                </motion.div>
              ) : (
                <>
                  <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold leading-relaxed bg-gradient-to-r from-white via-white/95 to-white/90 bg-clip-text text-transparent break-words">
                    {displayedMission}
                    {displayedMission.length < mission.length && (
                      <motion.span
                        animate={{ opacity: [1, 0, 1] }}
                        transition={{ repeat: Infinity, duration: 0.8 }}
                        className="inline-block w-0.5 h-6 md:h-8 bg-sky-400 ml-1 rounded-full"
                      />
                    )}
                  </p>

                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.8 }}
                    className="mt-4 md:mt-6 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 flex-wrap"
                  >
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setEditMode(true)}
                      className="flex items-center gap-2 text-sm text-white/70 hover:text-white transition-colors group cursor-pointer"
                    >
                      <Edit3 className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                      Edit directly
                    </motion.button>
                    <span className="text-white/30 hidden sm:inline">•</span>
                    <span className="text-sm text-white/60">
                      This becomes your North Star for content curation
                    </span>
                  </motion.div>
                </>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {!editMode && (
        <>
          {/* Refinement Options */}
          <RefinementOptions 
            mission={mission}
            onRefine={onRefine}
            isRefining={isRefining}
          />

          {/* Enhanced custom refinement */}
          <AnimatePresence>
            {refineMode && (
              <motion.div
                initial={{ opacity: 0, y: 15, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, y: -15, height: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                <div className="relative">
                  <div className="absolute -inset-1 bg-gradient-to-r from-sky-400/20 via-purple-400/20 to-rose-400/20 rounded-xl blur-md" />
                  <div className="relative">
                    <ChatInput
                      placeholder="Tell Shadow what to change... (e.g., 'Make it sound more professional' or 'Add something about helping others')"
                      onSubmit={handleCustomRefine}
                      disabled={isRefining}
                      rows={2}
                      className="bg-black/20 border-white/20"
                    />
                  </div>
                </div>
                <div className="flex justify-center">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setRefineMode(false)}
                    className="text-sm text-white/60 hover:text-white transition-colors cursor-pointer"
                  >
                    Cancel
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Enhanced actions with better context */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="flex flex-col sm:flex-row justify-center gap-3 md:gap-4 flex-wrap pt-4"
          >
            {!refineMode && (
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setRefineMode(true)}
                className="flex items-center justify-center gap-2 md:gap-3 px-4 md:px-6 py-2.5 md:py-3 rounded-lg md:rounded-xl border border-white/30 bg-white/10 hover:bg-white/20 transition-all backdrop-blur-sm cursor-pointer text-sm md:text-base"
              >
                <RefreshCw className="w-4 h-4 md:w-5 md:h-5" />
                Custom refine
              </motion.button>
            )}

            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={onAccept}
              disabled={isSaving}
              className="flex items-center justify-center gap-2 md:gap-3 px-6 md:px-8 py-2.5 md:py-3 text-base md:text-lg font-bold rounded-lg md:rounded-xl bg-white text-black hover:bg-white/90 transition-all duration-200 shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:shadow-[0_0_40px_rgba(255,255,255,0.3)] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer disabled:hover:scale-100"
            >
              {isSaving ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <Sparkles className="w-4 h-4 md:w-5 md:h-5" />
                  </motion.div>
                  <span className="hidden sm:inline">Saving your mission...</span>
                  <span className="sm:hidden">Saving...</span>
                </>
              ) : (
                <>
                  <span className="hidden sm:inline">Perfect! Continue</span>
                  <span className="sm:hidden">Continue</span>
                  <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
                </>
              )}
            </motion.button>
          </motion.div>
        </>
      )}
    </motion.div>
  );
}