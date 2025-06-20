// lib/supabase/server.ts

import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

// This is the server-side Supabase client for Server Components.
// It's used to fetch data on the server and check the user's session.
export const createServer = () => {
  const cookieStore = cookies();

  return createServerComponentClient({
    cookies: () => cookieStore,
  });
};
