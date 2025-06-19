// app/page.tsx (Updated)

import HeroSection from "@/components/home/hero-section";
import FeaturesSection from "../components/home/features-section";

export default function Home() {
  return (
    // The outer wrapper divs are no longer needed, as the layout handles positioning
    <>
      <HeroSection />
      <FeaturesSection />
    </>
  );
}
