// app/(private)/onboarding/onboarding-client.tsx

"use client";

import { useState, useTransition } from "react";
import { User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ChatInput } from "@/components/ui/chat-input";
import { toast } from "sonner";
import { Crop, Check, ArrowRight } from "lucide-react";
import IridescentIcon from "@/components/ui/iridescent-icon";
import { Button } from "@/components/ui/button";
import {
  saveMissionAction,
  populateInitialMuseboardAction,
  completeOnboardingAction
} from "@/lib/actions/onboarding";

interface OnboardingClientProps {
  user: User;
  existingMission?: any;
}

export function OnboardingClient({ user, existingMission }: OnboardingClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  
  // Core state
  const [mission, setMission] = useState(existingMission?.mission_statement || "");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showMission, setShowMission] = useState(!!existingMission?.mission_statement);
  const [isGeneratingContent, setIsGeneratingContent] = useState(false);

  // Handle mission submission with AI enhancement
  const handleMissionSubmit = async (userInput: string) => {
    if (!userInput.trim()) return;
    
    setIsProcessing(true);
    
    try {
      // Call our AI service to enhance/refine the mission
      const response = await fetch('/api/ai/mission/enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userInput: userInput.trim(),
          userId: user.id
        })
      });

      if (!response.ok) {
        throw new Error('Failed to process mission');
      }

      const data = await response.json();
      
      if (data.mission) {
        setMission(data.mission);
        setShowMission(true);
        
        // Save to database
        startTransition(async () => {
          const saveResult = await saveMissionAction(data.mission);
          if (!saveResult.success) {
            toast.error("Failed to save mission");
          }
        });
        
        toast.success("Mission crafted! ✨", {
          description: "Shadow has refined your vision"
        });
      } else {
        toast.error("Failed to craft mission");
      }
    } catch (error) {
      console.error('Mission processing error:', error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle the final step - generate museboard
  const handleGenerateMuseboard = async () => {
    if (!mission) return;
    
    setIsGeneratingContent(true);
    
    startTransition(async () => {
      try {
        // Generate AI-curated content
        const populateResult = await populateInitialMuseboardAction();
        
        if (populateResult.success && populateResult.data) {
          // Complete onboarding
          const completeResult = await completeOnboardingAction();
          
          if (completeResult.success) {
            toast.success("🎉 Welcome to your Museboard!", {
              description: `${populateResult.data.items_added} pieces of inspiration curated just for you`,
              duration: 4000,
            });
            
            setTimeout(() => {
              router.push('/museboard');
            }, 2000);
          } else {
            toast.error("Failed to complete setup");
          }
        } else {
          toast.error("Failed to generate content");
        }
      } catch (error) {
        console.error('Content generation error:', error);
        toast.error("Failed to generate your Museboard");
      } finally {
        setIsGeneratingContent(false);
      }
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="max-w-2xl w-full space-y-8">
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="inline-flex items-center justify-center"
          >
            <IridescentIcon 
              icon={Crop} 
              className="icon-iridescent h-12 w-12" 
            />
          </motion.div>
          
          <h1 className="text-4xl font-bold">Welcome to MBLM</h1>
          <p className="text-lg text-muted-foreground max-w-md mx-auto">
            Your private AI muse. Let's start with what drives you.
          </p>
        </motion.div>

        <AnimatePresence mode="wait">
          {!showMission ? (
            /* Step 1: Mission Input */
            <motion.div
              key="mission-input"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="text-center space-y-2">
                <h2 className="text-xl font-semibold">What's your mission?</h2>
                <p className="text-muted-foreground">
                  Share your goals, dreams, or what you want to accomplish. Shadow will help refine it.
                </p>
              </div>
              
              <div className="relative">
                <ChatInput
                  placeholder="e.g., Help solo founders build profitable products, Become a better leader, Create meaningful art that inspires others..."
                  onSubmit={handleMissionSubmit}
                  disabled={isProcessing}
                  rows={3}
                  className="text-center"
                />
                
                {isProcessing && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 bg-background/80 flex items-center justify-center rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      >
                        <Crop className="w-5 h-5 text-primary" />
                      </motion.div>
                      <span className="text-sm text-muted-foreground">
                        Shadow is crafting your mission...
                      </span>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          ) : (
            /* Step 2: Mission Display & Generate */
            <motion.div
              key="mission-display"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {/* Mission Display */}
              <motion.div
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                className="relative"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-xl blur-xl" />
                <div className="relative bg-card border border-border/50 rounded-xl p-8 space-y-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Crop className="w-4 h-4" />
                    <span>Your Mission</span>
                  </div>
                  <p className="text-lg leading-relaxed">{mission}</p>
                </div>
              </motion.div>

              {/* Generate Button */}
              <div className="text-center space-y-4">
                <p className="text-muted-foreground">
                  Ready to see Shadow curate inspiration specifically for your mission?
                </p>
                
                <Button
                  onClick={handleGenerateMuseboard}
                  disabled={isGeneratingContent || isPending}
                  size="lg"
                  className="group"
                >
                  {isGeneratingContent ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        className="w-4 h-4 mr-2"
                      >
                        <Crop className="w-full h-full" />
                      </motion.div>
                      Curating your Museboard...
                    </>
                  ) : (
                    <>
                      Generate My Museboard
                      <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </Button>
              </div>

              {/* Generation Progress */}
              {isGeneratingContent && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center space-y-3"
                >
                  <div className="flex items-center justify-center gap-2">
                    <div className="flex gap-1">
                      {[...Array(3)].map((_, i) => (
                        <motion.div
                          key={i}
                          className="w-2 h-2 bg-primary rounded-full"
                          animate={{ y: [0, -8, 0], opacity: [0.4, 1, 0.4] }}
                          transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Shadow is working...</p>
                    <p className="text-xs text-muted-foreground">
                      Finding quotes, insights, and inspiration aligned with your mission
                    </p>
                  </div>
                </motion.div>
              )}

              {/* Edit Mission Option */}
              {!isGeneratingContent && (
                <div className="text-center">
                  <button
                    onClick={() => setShowMission(false)}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors underline"
                  >
                    Want to refine your mission?
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}