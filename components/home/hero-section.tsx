// components/home/hero-section.tsx

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
        {/* ---------------------------------------------------------------- */}
        {/* HEADLINE                                                        */}
        {/* ---------------------------------------------------------------- */}
        <h1 className="text-5xl md:text-7xl font-bold leading-tight tracking-tight">
          <span className="text-iridescent">Re-Engineer</span>
          <span className="block text-foreground">Your Thinking</span>
        </h1>

        {/* ---------------------------------------------------------------- */}
        {/* SUB-HEADLINE                                                    */}
        {/* ---------------------------------------------------------------- */}
        <h2 className="text-lg md:text-2xl text-muted-foreground font-light max-w-3xl mx-auto leading-relaxed">
        <span className="italic">Capture, organize, and reconnect with ideas that fuel you.</span>
          <div className="flex justify-center items-center">
            <span>Keep your&nbsp;</span>

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
                      font-bold text-iridescent transition-all duration-1000 ease-in-out whitespace-nowrap
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

            <span>&nbsp;front-of-mind. All the time.</span>
          </div>
          
        </h2>

        {/* ---------------------------------------------------------------- */}
        {/* CTA BUTTON                                                      */}
        {/* ---------------------------------------------------------------- */}
        <div className="pt-8 flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button
            variant="white"
            size="lg"
            asChild
            className="px-8 py-6 text-lg font-semibold rounded-xl"
          >
            <Link href="/sign-in">Try MBLM</Link>
          </Button>
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* TRUST INDICATORS                                                */}
        {/* ---------------------------------------------------------------- */}
        <div className="pb-4 flex flex-wrap justify-center items-center gap-8 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse shadow-[0_0_8px_oklch(1_0_0/0.6)]" />
            <span>AI Powered</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse delay-300 shadow-[0_0_8px_oklch(1_0_0/0.6)]" />
            <span>Private</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse delay-700 shadow-[0_0_8px_oklch(1_0_0/0.6)]" />
            <span>Personal</span>
          </div>
        </div>
      </div>
    </section>
  );
}
