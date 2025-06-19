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
    <section className="relative py-12 flex items-center justify-center bg-background px-6 overflow-hidden">
      {/* Subtle gradient overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10"></div>

      {/* Animated background orbs */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/8 rounded-full blur-3xl animate-pulse glow-primary"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-primary/5 rounded-full blur-3xl animate-pulse glow-primary delay-1000"></div>
        <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-primary/3 rounded-full blur-2xl animate-pulse delay-2000"></div>
      </div>

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
              <span>Keep your&nbsp;</span>
              <div
                className="relative inline-block overflow-hidden transition-all duration-700 ease-in-out"
                style={{ width: words[currentWordIndex].width }}
              >
                {words.map((wordObj, index) => (
                  <span
                    key={wordObj.text}
                    className={`font-bold text-foreground transition-all duration-1000 ease-in-out whitespace-nowrap ${
                      index === currentWordIndex
                        ? "opacity-100 translate-y-0 relative"
                        : index ===
                          (currentWordIndex - 1 + words.length) % words.length
                        ? "opacity-0 -translate-y-full absolute top-0 left-0"
                        : "opacity-0 translate-y-full absolute top-0 left-0"
                    }`}
                    style={{
                      transitionDelay:
                        index === currentWordIndex ? "150ms" : "0ms",
                    }}
                  >
                    {wordObj.text}
                  </span>
                ))}
              </div>
              <span>&nbsp;front of mind.</span>
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
            <Link href="sign-in">Try MuseboardLM</Link>
          </Button>
        </div>

        {/* TRUST INDICATORS */}
        <div className="pb-16 flex flex-wrap justify-center items-center gap-8 text-sm text-muted-foreground">
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
