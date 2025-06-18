"use client";

import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

export default function HeroSection() {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const words = ["Engineer", "Re-Shape", "Curate"];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentWordIndex((prev) => (prev + 1) % words.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [words.length]);

  return (
    <section className="relative py-32 flex items-center justify-center bg-background px-6 overflow-hidden">
      {/* Subtle gradient overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10"></div>

      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-primary/3 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative text-center max-w-5xl mx-auto space-y-8 z-10">
        <div className="space-y-6">
          <h1 className="text-6xl md:text-8xl font-bold text-foreground leading-tight tracking-tight">
            <div className="h-[1.2em] flex items-center justify-center overflow-hidden">
              <div className="relative">
                {words.map((word, index) => (
                  <span
                    key={word}
                    className={`absolute inset-0 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent transition-all duration-1000 ease-in-out ${
                      index === currentWordIndex
                        ? "opacity-100 translate-y-0"
                        : index ===
                          (currentWordIndex - 1 + words.length) % words.length
                        ? "opacity-0 -translate-y-full"
                        : "opacity-0 translate-y-full"
                    }`}
                    style={{
                      transitionDelay:
                        index === currentWordIndex ? "150ms" : "0ms",
                    }}
                  >
                    {word}
                  </span>
                ))}
                {/* Invisible placeholder to maintain consistent width */}
                <span className="invisible">Re-Shape</span>
              </div>
            </div>
            <div className="mt-4">Your Thinking </div>
          </h1>
          <h2 className="text-xl md:text-3xl text-muted-foreground font-light max-w-3xl mx-auto leading-relaxed">
            Keep your mission, dreams, and goals front of mind.
            <div>All the time.</div>{" "}
          </h2>
        </div>

        <div className="pt-8 flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button className="px-10 py-4 text-lg font-semibold bg-primary hover:bg-primary/90 text-primary-foreground rounded-full shadow-2xl hover:shadow-primary/25 transition-all duration-300 transform hover:scale-105 hover:-translate-y-1">
            Try MuseboardLM
          </Button>
          <Button
            variant="outline"
            className="px-8 py-4 text-lg font-medium border-border hover:border-primary hover:bg-primary/10 text-foreground rounded-full transition-all duration-300"
          >
            Learn More
          </Button>
        </div>

        {/* Trust indicators or feature highlights */}
        <div className="pt-12 flex flex-wrap justify-center items-center gap-8 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-primary rounded-full"></div>
            <span>Private</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-primary rounded-full"></div>
            <span>Personal</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-primary rounded-full"></div>
            <span>AI Powered</span>
          </div>
        </div>
      </div>
    </section>
  );
}
