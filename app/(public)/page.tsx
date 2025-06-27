// app/(public)/page.tsx

import HeroSection from "@/components/home/hero-section";
import FeaturesSection from "@/components/home/features-section";

export default function Home() {
  return (
    <>
      <HeroSection />
      <FeaturesSection />
    </>
  );
}