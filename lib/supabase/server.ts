import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import type { Database } from "@/types/supabase";

// This is the server-side Supabase client for Server Components.
// It's used to fetch data on the server and check the user's session.
export const createServer = () => {
  return createServerComponentClient<Database>({
    cookies: cookies,
  });
};

// Export the type for use in server components
export type SupabaseServer = ReturnType<typeof createServer>;