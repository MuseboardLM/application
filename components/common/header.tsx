// components/common/header.tsx

import { createServer } from "@/lib/supabase/server";
import { logOut } from "@/app/auth/actions/actions";
import HeaderClient from "./header-client";
import TrashView from "./TrashView"; // --- ADD THIS IMPORT ---

type Profile = {
  full_name: string | null;
  avatar_url: string | null;
} | null;

export default async function Header() {
  const supabase = createServer();
  let profile: Profile = null;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("full_name, avatar_url")
      .eq("id", user.id)
      .single();
    profile = data;
  }

  // --- PASS THE TRASHVIEW COMPONENT AS A PROP ---
  return <HeaderClient user={user} profile={profile} logOut={logOut} trashView={<TrashView />} />;
}