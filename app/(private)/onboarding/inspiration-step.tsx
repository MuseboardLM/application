// app/(private)/onboarding/inspiration-step.tsx

"use client";

import { useState, useEffect, useTransition } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Sparkles, Loader2, Users, Heart } from "lucide-react";
import IridescentIcon from "@/components/ui/iridescent-icon";
import { getInspirationSuggestionsAction } from "@/lib/actions/onboarding";
import { InspirationSection } from "./components/inspiration-section";
import type { Hero, Interest } from "@/lib/types";

interface InspirationStepProps {
  mission: string;
  onComplete: (heroes: string[], interests: string[]) => void;
  isSubmitting: boolean;
}

export function InspirationStep({ mission, onComplete, isSubmitting }: InspirationStepProps) {
  const [isFetching, startFetching] = useTransition();
  const [suggestions, setSuggestions] = useState<{ heroes: Hero[]; interests: Interest[] }>({ 
    heroes: [], 
    interests: [] 
  });
  const [selectedHeroes, setSelectedHeroes] = useState<string[]>([]);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

  // Fetch suggestions on mount
  useEffect(() => {
    startFetching(async () => {
      const result = await getInspirationSuggestionsAction(mission);
      if (result.success && result.data) {
        setSuggestions(result.data);
      } else {
        toast.error("Couldn't get suggestions", { description: result.error });
      }
    });
  }, [mission]);

  const toggleHeroSelection = (hero: string) => {
    setSelectedHeroes(prev => 
      prev.includes(hero) 
        ? prev.filter(h => h !== hero)
        : [...prev, hero]
    );
  };

  const toggleInterestSelection = (interest: string) => {
    setSelectedInterests(prev => 
      prev.includes(interest) 
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };

  const addCustomHero = (hero: string) => {
    if (hero.trim() && !selectedHeroes.includes(hero.trim())) {
      setSelectedHeroes(prev => [...prev, hero.trim()]);
    }
  };

  const addCustomInterest = (interest: string) => {
    if (interest.trim() && !selectedInterests.includes(interest.trim())) {
      setSelectedInterests(prev => [...prev, interest.trim()]);
    }
  };

  const handleComplete = () => {
    if (selectedHeroes.length === 0) {
      toast.error("Please select at least one hero to continue");
      return;
    }
    if (selectedInterests.length === 0) {
      toast.error("Please select at least one interest to continue");
      return;
    }
    onComplete(selectedHeroes, selectedInterests);
  };

  const canComplete = selectedHeroes.length > 0 && selectedInterests.length > 0;

  return (
    <div className="h-screen px-4 max-w-6xl mx-auto pt-8 pb-8 overflow-hidden">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-3 mb-12"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
          className="inline-block"
        >
          <IridescentIcon icon={Heart} className="h-12 w-12" />
        </motion.div>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tighter">
          Find Your Inspiration
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Shadow will curate content based on the heroes and interests that fuel your mission.
        </p>
      </motion.div>

      {/* Two Sections */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex gap-12 mb-12"
      >
        <InspirationSection
          title="Heroes & Mentors"
          icon={Users}
          suggestions={suggestions.heroes}
          selected={selectedHeroes}
          onToggle={toggleHeroSelection}
          onCustomAdd={addCustomHero}
          placeholder="Add a hero... (e.g., 'Marcus Aurelius')"
          isLoading={isFetching}
          selectedCount={selectedHeroes.length}
        />

        <InspirationSection
          title="Interests & Topics"
          icon={Users}
          suggestions={suggestions.interests}
          selected={selectedInterests}
          onToggle={toggleInterestSelection}
          onCustomAdd={addCustomInterest}
          placeholder="Add an interest... (e.g., 'Stoicism')"
          isLoading={isFetching}
          selectedCount={selectedInterests.length}
        />
      </motion.div>

      {/* Bottom Action */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="text-center space-y-4"
      >
        <motion.button
          whileHover={{ scale: canComplete ? 1.05 : 1 }}
          whileTap={{ scale: canComplete ? 0.95 : 1 }}
          onClick={handleComplete}
          disabled={!canComplete || isSubmitting}
          className="px-8 py-3 text-lg font-semibold rounded-xl bg-white text-black hover:bg-white/90 transition-all duration-200 shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] disabled:opacity-50 cursor-pointer"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Building Your Museboard...
            </>
          ) : (
            <>
              Curate My Museboard
              <Sparkles className="w-5 h-5 ml-2 inline" />
            </>
          )}
        </motion.button>

        {!canComplete && !isSubmitting && (
          <p className="text-sm text-muted-foreground">
            Select at least one hero and one interest to continue
          </p>
        )}
      </motion.div>
    </div>
  );
}