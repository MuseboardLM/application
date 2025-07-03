// lib/supabase/server.ts

import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import type { Database } from "@/types/supabase"; // ✨ Make sure you have a types file for your DB

// This is the server-side Supabase client for Server Components.
// It's used to fetch data on the server and check the user's session.
export const createServer = () => {
  // ⬇️ MODIFIED: The cookies() function is now passed directly
  // This allows the auth-helpers to call it at the correct time.
  return createServerComponentClient<Database>({
    cookies: cookies,
  });
};
