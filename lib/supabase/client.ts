// lib/supabase/client.ts

"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/supabase";

// Create a singleton client for the browser
let client: ReturnType<typeof createBrowserClient<Database>> | null = null;

export const createClient = () => {
  // Create the client only once
  if (!client) {
    client = createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  
  return client;
};

// Export the type for use in components
export type SupabaseClient = ReturnType<typeof createClient>;