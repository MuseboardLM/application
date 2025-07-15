// app/(private)/onboarding/inspiration-step.tsx

"use client";

import { useState, useEffect, useTransition } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ChatInput } from "@/components/ui/chat-input";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Sparkles, UserPlus, Tag, Loader2 } from "lucide-react";
import { getInspirationSuggestionsAction } from "@/lib/actions/onboarding";
import type { Hero, Interest } from "@/lib/types";

interface InspirationStepProps {
  mission: string;
  onComplete: (heroes: string[], interests: string[]) => void;
  isSubmitting: boolean;
}

export function InspirationStep({ mission, onComplete, isSubmitting }: InspirationStepProps) {
  const [isFetching, startFetching] = useTransition();
  const [suggestions, setSuggestions] = useState<{ heroes: Hero[]; interests: Interest[] }>({ heroes: [], interests: [] });
  const [selectedHeroes, setSelectedHeroes] = useState<string[]>([]);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

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

  const toggleSelection = (item: string, type: 'hero' | 'interest') => {
    const list = type === 'hero' ? selectedHeroes : selectedInterests;
    const setter = type === 'hero' ? setSelectedHeroes : setSelectedInterests;
    if (list.includes(item)) {
      setter(list.filter(i => i !== item));
    } else {
      setter([...list, item]);
    }
  };

  const handleAddCustom = (input: string, type: 'hero' | 'interest') => {
    if (!input.trim()) return;
    const setter = type === 'hero' ? setSelectedHeroes : setSelectedInterests;
    setter(prev => [...new Set([...prev, input.trim()])]);
  };

  const canContinue = selectedHeroes.length > 0 && selectedInterests.length > 0;

  return (
    <motion.div
      key="inspiration-step"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full max-w-4xl mx-auto space-y-10"
    >
      <div className="text-center space-y-3">
        <h2 className="text-3xl font-bold tracking-tight">Who and what inspires you?</h2>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Based on your mission, Shadow has some ideas. Select a few heroes and interests, or add your own.
        </p>
      </div>

      {isFetching ? (
        <div className="flex items-center justify-center gap-3 text-muted-foreground h-64">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Shadow is seeking inspiration...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Heroes Section */}
          <div className="space-y-4">
            <h3 className="flex items-center gap-2 text-xl font-semibold"><UserPlus className="w-5 h-5 text-primary" /> Heroes & Mentors</h3>
            <div className="p-4 bg-background/50 border rounded-lg min-h-[150px] space-y-3">
              <p className="text-sm text-muted-foreground">Tap to select suggestions:</p>
              <div className="flex flex-wrap gap-2">
                {suggestions.heroes.map(hero => (
                  <Badge
                    key={hero.name}
                    variant={selectedHeroes.includes(hero.name) ? 'default' : 'secondary'}
                    onClick={() => toggleSelection(hero.name, 'hero')}
                    className="cursor-pointer hover:scale-105 transition-transform"
                  >
                    {hero.name}
                  </Badge>
                ))}
              </div>
            </div>
            <ChatInput
              placeholder="Add a hero... (e.g., 'Marcus Aurelius')"
              onSubmit={(input) => handleAddCustom(input, 'hero')}
              disabled={isSubmitting}
            />
             <div className="flex flex-wrap gap-2 pt-2">
              {selectedHeroes.map(hero => (
                <Badge key={hero} onRemove={() => toggleSelection(hero, 'hero')}>{hero}</Badge>
              ))}
            </div>
          </div>

          {/* Interests Section */}
          <div className="space-y-4">
            <h3 className="flex items-center gap-2 text-xl font-semibold"><Tag className="w-5 h-5 text-primary" /> Interests & Topics</h3>
            <div className="p-4 bg-background/50 border rounded-lg min-h-[150px] space-y-3">
              <p className="text-sm text-muted-foreground">Tap to select suggestions:</p>
              <div className="flex flex-wrap gap-2">
                {suggestions.interests.map(interest => (
                  <Badge
                    key={interest.category}
                    variant={selectedInterests.includes(interest.category) ? 'default' : 'secondary'}
                    onClick={() => toggleSelection(interest.category, 'interest')}
                    className="cursor-pointer hover:scale-105 transition-transform"
                  >
                    {interest.category}
                  </Badge>
                ))}
              </div>
            </div>
            <ChatInput
              placeholder="Add an interest... (e.g., 'Stoicism')"
              onSubmit={(input) => handleAddCustom(input, 'interest')}
              disabled={isSubmitting}
            />
            <div className="flex flex-wrap gap-2 pt-2">
              {selectedInterests.map(interest => (
                <Badge key={interest} onRemove={() => toggleSelection(interest, 'interest')}>{interest}</Badge>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="text-center pt-6">
        <Button
          onClick={() => onComplete(selectedHeroes, selectedInterests)}
          disabled={!canContinue || isSubmitting || isFetching}
          size="lg"
          className="group cursor-pointer hover:scale-105 transition-transform"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Building Your Museboard...
            </>
          ) : (
            <>
              Curate My Museboard
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </Button>
        {!canContinue && !isFetching && (
            <p className="text-sm text-muted-foreground mt-3">Select at least one hero and one interest to continue.</p>
        )}
      </div>
    </motion.div>
  );
}