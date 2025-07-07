// app/(private)/onboarding/onboarding-client.tsx

"use client";

import { useState, useTransition } from "react";
import { User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ChatInput } from "@/components/ui/chat-input";
import { saveMissionAction, completeOnboardingAction, uploadOnboardingFileAction } from "@/lib/actions/mission";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import { UploadCloudIcon, Crop, Check } from "lucide-react";
import IridescentIcon from "@/components/ui/iridescent-icon";

interface OnboardingClientProps {
  user: User;
  existingMission: any;
}

type OnboardingStep = "mission" | "content";

// Progress indicator component (now only 2 steps)
const ProgressIndicator = ({ currentStep }: { currentStep: OnboardingStep }) => {
  const steps = ["mission", "content"];
  const currentIndex = steps.indexOf(currentStep);
  
  return (
    <div className="flex justify-center mb-8">
      <div className="flex items-center gap-2">
        {steps.map((_, index) => (
          <motion.div
            key={index}
            className={`w-2 h-2 rounded-full transition-colors duration-300 ${
              index <= currentIndex ? "bg-primary" : "bg-primary/20"
            }`}
            initial={{ scale: 0.8 }}
            animate={{ scale: index === currentIndex ? 1.2 : 1 }}
            transition={{ duration: 0.3 }}
          />
        ))}
      </div>
    </div>
  );
};

// Character counter component
const CharacterCounter = ({ text, minLength = 10 }: { text: string; minLength?: number }) => {
  const isValid = text.length >= minLength;
  
  return (
    <div className="flex items-center justify-between mt-2 text-xs">
      <span className="text-muted-foreground">Press Enter to continue</span>
      <span className={`transition-colors ${isValid ? "text-green-500" : "text-muted-foreground"}`}>
        {isValid ? (
          <span className="flex items-center gap-1">
            <Check className="w-3 h-3" />
            Ready
          </span>
        ) : (
          `${Math.max(0, minLength - text.length)} more characters`
        )}
      </span>
    </div>
  );
};

export function OnboardingClient({ user, existingMission }: OnboardingClientProps) {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>(
    existingMission?.mission_statement ? "content" : "mission"
  );
  const [mission, setMission] = useState(existingMission?.mission_statement || "");
  const [isPending, startTransition] = useTransition();
  const [isUploading, setIsUploading] = useState(false);
  const [isCompletingOnboarding, setIsCompletingOnboarding] = useState(false);
  
  const router = useRouter();

  // Handle mission submission
  const handleMissionSubmit = (missionText: string) => {
    if (missionText.length < 10) {
      toast.error("Please share at least 10 characters about your mission");
      return;
    }
    
    startTransition(async () => {
      const formData = new FormData();
      formData.append("mission_statement", missionText);
      
      const result = await saveMissionAction(null, formData);
      
      if (result.success) {
        setMission(missionText);
        setCurrentStep("content");
        toast.success("Mission saved! Let's add your first inspiration.");
      } else {
        toast.error(result.error || "Failed to save mission");
      }
    });
  };

  // Handle content upload and complete onboarding in one flow
  const onDrop = async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    setIsUploading(true);

    try {
      // Step 1: Upload the file
      const formData = new FormData();
      formData.append("file", file);

      const uploadResult = await uploadOnboardingFileAction(formData);

      if (!uploadResult.success) {
        toast.error(uploadResult.error || "Failed to upload content");
        return;
      }

      // Step 2: Complete onboarding immediately after successful upload
      setIsCompletingOnboarding(true);
      
      const completeResult = await completeOnboardingAction();
      
      if (completeResult.success) {
        // Show success message and redirect
        toast.success("Perfect! Welcome to your Museboard 🎉", {
          description: "Your first inspiration has been added to your personal muse.",
          duration: 3000,
        });
        
        // Small delay to let user see the success message
        setTimeout(() => {
          router.push("/museboard");
        }, 1500);
      } else {
        toast.error(completeResult.error || "Failed to complete onboarding");
        setIsCompletingOnboarding(false);
      }

    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error("Failed to upload content: " + error.message);
      setIsCompletingOnboarding(false);
    } finally {
      setIsUploading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".jpeg", ".jpg", ".png", ".gif", ".webp"] },
    maxFiles: 1,
    disabled: isUploading || isCompletingOnboarding,
  });

  const isProcessing = isUploading || isCompletingOnboarding;

  return (
    <div className="max-w-2xl mx-auto p-8">
      <ProgressIndicator currentStep={currentStep} />
      
      <AnimatePresence mode="wait">
        {/* Step 1: Mission */}
        {currentStep === "mission" && (
          <motion.div
            key="mission"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-32"
          >
            <div className="text-center">
              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-3xl font-bold mb-2 flex items-center justify-center gap-2 group"
              >
                <IridescentIcon 
                  icon={Crop} 
                  className="icon-iridescent h-8 w-8 transition-transform duration-200 group-hover:rotate-12" 
                />
                <span>Welcome to MBLM</span>
              </motion.h1>
              <p className="text-muted-foreground">Your private & personal digital muse</p>
            </div>

            <div className="space-y-6">
              <div className="text-left">
                <h2 className="text-2xl font-semibold mb-2">What's your mission?</h2>
                <p className="text-muted-foreground leading-relaxed">
                  What are your deepest, most intimate dreams and goals?
                </p>
                <p className="text-muted-foreground leading-relaxed">What absolutely must be accomplished in your lifetime?</p>
              </div>
              
              <div className="space-y-2">
                <ChatInput
                  placeholder="e.g., Build something meaningful that changes lives and gives me the freedom to live on my own terms..."
                  onSubmit={handleMissionSubmit}
                  disabled={isPending}
                  rows={4}
                />
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 2: First Content - Now the final step */}
        {currentStep === "content" && (
          <motion.div
            key="content"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            <div className="text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="w-16 h-16 flex items-center justify-center mx-auto mb-8 group"
              >
                <IridescentIcon 
                  icon={Crop} 
                  className="icon-iridescent h-8 w-8 transition-transform duration-200 group-hover:rotate-12" 
                />
              </motion.div>
              
              <h2 className="text-2xl font-bold mb-3">Add Your First Inspiration</h2>
              <p className="text-muted-foreground max-w-md mx-auto mb-8">
                Upload something that fuels your mission - a screenshot, quote, image, anything that lights you up.
              </p>
            </div>

            <div 
              {...getRootProps()} 
              className={`
                border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-300
                ${isDragActive 
                  ? "border-primary bg-primary/10 scale-105" 
                  : "border-border hover:border-primary/50 hover:bg-primary/5"
                }
                ${isProcessing ? "opacity-50 cursor-not-allowed" : ""}
              `}
            >
              <input {...getInputProps()} />
              <motion.div
                animate={{ y: isDragActive ? -5 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <UploadCloudIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              </motion.div>
              
              {isProcessing ? (
                <div className="space-y-2">
                  {isUploading && (
                    <>
                      <p className="font-medium mb-2 text-lg">Uploading your inspiration...</p>
                      <p className="text-sm text-muted-foreground">Please wait while we save your content</p>
                    </>
                  )}
                  {isCompletingOnboarding && (
                    <>
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4"
                      >
                        <Check className="w-6 h-6 text-green-500" />
                      </motion.div>
                      <p className="font-medium mb-2 text-lg text-green-600">Upload successful!</p>
                      <p className="text-sm text-muted-foreground">Setting up your Museboard...</p>
                    </>
                  )}
                </div>
              ) : isDragActive ? (
                <p className="text-primary font-medium text-lg">Drop your inspiration here...</p>
              ) : (
                <div>
                  <p className="font-medium mb-2 text-lg">Drag & drop your first inspiration</p>
                  <p className="text-sm text-muted-foreground">
                    Screenshots, photos, quotes - anything that connects to your mission
                  </p>
                </div>
              )}
            </div>

            <div className="text-center">
              <span className="text-xs text-muted-foreground">Step 2 of 2</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}