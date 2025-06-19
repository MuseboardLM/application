import { Button } from "@/components/ui/button";
import Image from "next/image";
import HeroSection from "@/components/home/hero-section";
import FeaturesSection from "../components/home/features-section";

export default function Home() {
  return (
    <div className="relative bg-background overflow-hidden">
      {/* Unified Background Elements - Spans entire page */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Subtle gradient overlay for depth */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/8"></div>

        {/* Animated background orbs - positioned to flow across sections */}
        <div className="absolute top-1/6 left-1/5 w-96 h-96 bg-primary/8 rounded-full blur-3xl animate-pulse glow-primary"></div>
        <div className="absolute top-2/3 right-1/5 w-80 h-80 bg-primary/6 rounded-full blur-3xl animate-pulse glow-primary delay-1000"></div>
        <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-primary/4 rounded-full blur-2xl animate-pulse delay-2000"></div>
        <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-primary/3 rounded-full blur-3xl animate-pulse delay-3000"></div>
        <div className="absolute top-3/4 left-1/6 w-56 h-56 bg-primary/5 rounded-full blur-3xl animate-pulse delay-4000"></div>
      </div>

      {/* Content sections with relative positioning */}
      <div className="relative z-10">
        <HeroSection />
        <FeaturesSection />
      </div>
    </div>
  );
}
