// app/(private)/onboarding/page.tsx

import { redirect } from "next/navigation";
import { createServer } from "@/lib/supabase/server";
import { OnboardingClient } from "./onboarding-client";

export default async function OnboardingPage() {
  const supabase = createServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  // Check if user has already completed onboarding
  const { data: mission } = await supabase
    .from("user_missions")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (mission?.onboarding_completed) {
    redirect("/museboard");
  }

  return (
    <div className="min-h-screen bg-background">
      <OnboardingClient user={user} existingMission={mission} />
    </div>
  );
}