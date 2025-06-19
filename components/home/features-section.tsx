import { Brain, Shield, Sparkles } from "lucide-react";
import Image from "next/image";

const features = [
  {
    icon: Brain,
    title: "Feed it what fuels you",
    description:
      "Inject posts, screenshots, PDFs―whatever drives your mindset and inspiration. MuseboardLM learns from what fuels you so it can push you further.",
    image: "/api/placeholder/400/300", // You'll replace this with actual images
    imageAlt: "AI analyzing personal goals and dreams visualization",
  },
  {
    icon: Shield,
    title: "Get Mental Ammo―On Demand",
    description:
      "AI without the generic answers. Instead, it reasons wih your own source materials and fires back clariy and perspective shifts from stuff that actually matters to you.",
    image: "/api/placeholder/400/300", // You'll replace this with actual images
    imageAlt: "Privacy and security shield protecting personal data",
  },
  {
    icon: Sparkles,
    title: "Stay sharp and switched on",
    description:
      "Keep your mission, dreams, and goals front-of-mind and your thinking in forward motion. No autopilot. No forgetting what you said you'd become. Every time you open it, your Muse reminds you who you really are.",
    image: "/api/placeholder/400/300", // You'll replace this with actual images
    imageAlt: "Personal growth dashboard with progress tracking",
  },
];

export default function FeaturesSection() {
  return (
    <section className="py-8 relative">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-4xl text-foreground mb-6">
            Your Private & Personal AI Muse
          </h2>
        </div>

        {/* Features Grid */}
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
                {/* Content */}
                <div className="flex-1 space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary/10 border border-primary/20 rounded-xl glow-primary">
                      <Icon className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-2xl md:text-lg text-foreground">
                      {feature.title}
                    </h3>
                  </div>
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>

                {/* Image */}
                <div className="flex-1 relative">
                  <div className="relative rounded-2xl overflow-hidden border border-border/30 bg-card/50 backdrop-blur-sm glow-primary">
                    <div className="aspect-[4/3] bg-gradient-to-br from-primary/10 via-primary/5 to-background relative">
                      {/* Placeholder for actual images */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center space-y-4">
                          <Icon className="h-16 w-16 text-primary mx-auto opacity-50" />
                          <p className="text-muted-foreground text-sm">
                            {feature.imageAlt}
                          </p>
                        </div>
                      </div>

                      {/* You can replace this div with an actual Image component when you have images */}
                      {/* 
                      <Image
                        src={feature.image}
                        alt={feature.imageAlt}
                        fill
                        className="object-cover"
                      />
                      */}
                    </div>

                    {/* Subtle overlay effect */}
                    <div className="absolute inset-0 bg-gradient-to-t from-background/20 to-transparent pointer-events-none"></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
