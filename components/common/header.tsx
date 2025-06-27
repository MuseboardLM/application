// components/common/header.tsx

import { createServer } from "@/lib/supabase/server";
import { logOut } from "@/app/auth/actions/actions";
import HeaderClient from "./header-client";

// Define a type for the profile data for better type safety
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

  // If a user is logged in, fetch their profile
  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("full_name, avatar_url")
      .eq("id", user.id)
      .single();
    profile = data;
  }

  // Pass user, profile, and the logout action to the client component
  return <HeaderClient user={user} profile={profile} logOut={logOut} />;
}