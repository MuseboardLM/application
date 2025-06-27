// app/dashboard/account/page.tsx

import { redirect } from "next/navigation";
import { createServer } from "@/lib/supabase/server";
import { AccountForm } from "@/components/auth/account-form"; 

export default async function AccountPage() {
  const supabase = createServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // This check is redundant thanks to the dashboard layout, but it's good practice
    // for type safety and ensuring this page is never rendered without a user.
    redirect("/sign-in");
  }

  // Fetch the profile data from our 'profiles' table.
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return <AccountForm user={user} profile={profile} />;
}