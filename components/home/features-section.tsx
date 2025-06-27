// components/home/features-section.tsx

import { Brain, Shield, Sparkles } from "lucide-react";
import Image from "next/image";
import { CardContainer } from "@/components/ui/card-container"; // <-- 1. IMPORTED CardContainer

const features = [
  {
    icon: Brain,
    title: "Feed it what fuels you",
    description:
      "Inject posts, screenshots, PDFs—whatever drives your mindset and inspiration. MuseboardLM learns from what fuels you so it can push you further.",
    imageAlt: "AI analyzing personal goals and dreams visualization",
  },
  {
    icon: Shield,
    title: "Get Mental Ammo—On Demand",
    description:
      "AI without the generic answers. Instead, it reasons with your own source materials and fires back clarity and perspective shifts from stuff that actually matters to you.",
    imageAlt: "Privacy and security shield protecting personal data",
  },
  {
    icon: Sparkles,
    title: "Stay sharp and switched on",
    description:
      "Keep your mission, dreams, and goals front-of-mind and your thinking in forward motion. No autopilot. No forgetting what you said you'd become. Every time you open it, your Muse reminds you who you really are.",
    imageAlt: "Personal growth dashboard with progress tracking",
  },
];

export default function FeaturesSection() {
  return (
    <section className="py-16 md:py-24 relative">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-5xl text-foreground mb-6">
            Your Private & Personal AI Muse
          </h2>
        </div>
        <div className="space-y-32">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            const isEven = index % 2 === 0;
            return (
              <div
                key={feature.title}
                className={`flex flex-col ${
                  isEven ? "lg:flex-row" : "lg:flex-row-reverse"
                } items-center gap-12 lg:gap-20`}
              >
                <div className="flex-1 space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary/10 border border-primary/20 rounded-xl glow-primary">
                      <Icon className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-xl md:text-2xl text-foreground">
                      {feature.title}
                    </h3>
                  </div>
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>

                {/* --- 2. THIS ENTIRE BLOCK IS UPDATED --- */}
                <div className="w-full flex-1 relative flex justify-center">
                  <CardContainer className="w-full max-w-lg p-0 overflow-hidden">
                    {/* p-0 overrides default padding, overflow-hidden clips corners */}
                    <div className="aspect-[4/3] relative">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center space-y-4 px-4">
                          <Icon
                            className="h-12 w-12 text-primary mx-auto opacity-50"
                          />
                          <p className="text-muted-foreground text-sm">
                            {feature.imageAlt}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContainer>
                </div>

              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}