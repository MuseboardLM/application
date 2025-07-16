// app/(private)/onboarding/inspiration-step.tsx

"use client";

import { useState, useEffect, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { ChatInput } from "@/components/ui/chat-input";
import { ArrowRight, Sparkles, Loader2, Users, Heart, Plus } from "lucide-react";
import IridescentIcon from "@/components/ui/iridescent-icon";
import { getInspirationSuggestionsAction } from "@/lib/actions/onboarding";
import { cn } from "@/lib/utils";
import type { Hero, Interest } from "@/lib/types";

interface InspirationStepProps {
  mission: string;
  onComplete: (heroes: string[], interests: string[]) => void;
  isSubmitting: boolean;
}

// Simple, clean selection chip
const SelectionChip = ({ 
  children, 
  selected, 
  onClick 
}: { 
  children: React.ReactNode;
  selected?: boolean;
  onClick?: () => void;
}) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 cursor-pointer",
        selected 
          ? "bg-white/10 border border-white/30 text-white" 
          : "bg-secondary/30 border border-border/50 hover:bg-secondary/50 hover:border-white/20"
      )}
    >
      {children}
    </button>
  );
};

// Clean section component
const Section = ({ 
  title, 
  icon: Icon, 
  suggestions, 
  selected, 
  onToggle, 
  onCustomAdd,
  placeholder,
  isLoading,
  selectedCount
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  suggestions: Array<{ name?: string; category?: string }>;
  selected: string[];
  onToggle: (item: string) => void;
  onCustomAdd: (input: string) => void;
  placeholder: string;
  isLoading: boolean;
  selectedCount: number;
}) => {
  const [showCustomInput, setShowCustomInput] = useState(false);
  const suggestionNames = suggestions.map(s => s.name || s.category).filter(Boolean).slice(0, 6);

  return (
    <div className="flex-1 space-y-6">
      {/* Section Header */}
      <div className="text-center">
        <div className="relative inline-block">
          <div className="w-12 h-12 mx-auto rounded-full bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center mb-3">
            <Icon className="w-6 h-6 text-primary" />
          </div>
          {selectedCount > 0 && (
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
              {selectedCount}
            </div>
          )}
        </div>
        <h3 className="text-xl font-semibold">{title}</h3>
      </div>

      {/* Suggestions */}
      <div className="relative">
        <div className="absolute -inset-1 bg-gradient-to-r from-sky-400/20 via-purple-400/20 to-rose-400/20 rounded-xl blur-md opacity-50" />
        <div className="relative bg-gradient-to-br from-card via-card/90 to-card/70 rounded-xl p-6 shadow-2xl ring-1 ring-border/50 min-h-[200px] flex items-center justify-center">
          {isLoading ? (
            <div className="flex flex-col items-center gap-3 text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span className="text-sm">Shadow is thinking...</span>
            </div>
          ) : (
            <div className="w-full space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                Shadow's suggestions for you:
              </p>
              <div className="grid grid-cols-2 gap-3">
                {suggestionNames.map((suggestion) => (
                  <SelectionChip
                    key={suggestion}
                    selected={selected.includes(suggestion)}
                    onClick={() => onToggle(suggestion)}
                  >
                    {suggestion}
                  </SelectionChip>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Custom */}
      <div className="text-center">
        <AnimatePresence mode="wait">
          {showCustomInput ? (
            <motion.div
              key="input"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-3"
            >
              <ChatInput
                placeholder={placeholder}
                onSubmit={(input) => {
                  onCustomAdd(input);
                  setShowCustomInput(false);
                }}
                disabled={isLoading}
                rows={1}
              />
              <button
                onClick={() => setShowCustomInput(false)}
                className="text-sm text-muted-foreground hover:text-foreground cursor-pointer"
              >
                Cancel
              </button>
            </motion.div>
          ) : (
            <motion.button
              key="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCustomInput(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-secondary/30 hover:bg-secondary/50 transition-all cursor-pointer mx-auto"
            >
              <Plus className="w-4 h-4" />
              Add your own
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

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
        <Section
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

        <Section
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