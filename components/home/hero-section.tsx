"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useState, useEffect } from "react";

export default function HeroSection() {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const words = [
    { text: "mission", width: "3.9em" },
    { text: "dreams", width: "3.8em" },
    { text: "goals", width: "2.9em" },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentWordIndex((prev) => (prev + 1) % words.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [words.length]);

  return (
    <section className="relative py-12 flex items-center justify-center px-6">
      <div className="relative text-center max-w-5xl mx-auto space-y-8 z-10">
        <div className="space-y-6">
          {/* HEADLINE */}
          <h1 className="text-5xl md:text-7xl font-bold text-foreground leading-tight tracking-tight">
            <span className="block bg-gradient-to-r from-primary via-primary to-primary/80 bg-clip-text text-transparent">
              Re-Shape
            </span>
            <span className="block text-foreground">Your Thinking</span>
          </h1>

          {/* SUB-HEADLINE */}
          <h2 className="text-lg md:text-2xl text-muted-foreground font-light max-w-3xl mx-auto leading-relaxed">
            <div className="flex justify-center items-center">
              <span>Keep your </span>
              <div
                className="relative inline-block overflow-hidden transition-all duration-700 ease-in-out"
                style={{ width: words[currentWordIndex].width }}
              >
                {words.map((wordObj, index) => {
                  const isCurrent = index === currentWordIndex;
                  const isPrevious =
                    index ===
                    (currentWordIndex - 1 + words.length) % words.length;

                  return (
                    <span
                      key={wordObj.text}
                      className={`
                        font-bold text-foreground transition-all duration-1000 ease-in-out whitespace-nowrap
                        ${isCurrent ? "opacity-100" : "opacity-0"}
                        ${isCurrent ? "relative" : "absolute top-0 left-0"}
                        ${
                          isCurrent
                            ? "translate-y-0"
                            : isPrevious
                            ? "-translate-y-full"
                            : "translate-y-full"
                        }
                      `}
                      style={{
                        transitionDelay: isCurrent ? "150ms" : "0ms",
                      }}
                    >
                      {wordObj.text}
                    </span>
                  );
                })}
              </div>
              <span> front-of-mind.</span>
            </div>
            <div>All the time.</div>
          </h2>
        </div>

        {/* CTA BUTTON */}
        <div className="pt-8 flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button
            variant={"link"}
            className="px-10 py-5 text-lg font-semibold rounded-xl"
          >
            <Link href="sign-in">Try MBLM</Link>
          </Button>
        </div>

        {/* TRUST INDICATORS */}
        <div className="pb-4 flex flex-wrap justify-center items-center gap-8 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse shadow-[0_0_8px_oklch(0.6_0.24_215/0.6)]"></div>
            <span>AI Powered</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse delay-300 shadow-[0_0_8px_oklch(0.6_0.24_215/0.6)]"></div>
            <span>Private</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse delay-700 shadow-[0_0_8px_oklch(0.6_0.24_215/0.6)]"></div>
            <span>Personal</span>
          </div>
        </div>
      </div>
    </section>
  );
}
