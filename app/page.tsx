import { Button } from "@/components/ui/button";
import Image from "next/image";
import HeroSection from "@/components/home/hero-section";
import FeaturesSection from "../components/home/features-section";

export default function Home() {
  return (
    <div className="">
      <HeroSection />
      <FeaturesSection />
    </div>
  );
}
