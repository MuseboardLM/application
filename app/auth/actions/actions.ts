// app/auth/actions/actions.ts

"use server";

import { createServer } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function logOut() {
  const supabase = await createServer();
  await supabase.auth.signOut();
  redirect("/");
}