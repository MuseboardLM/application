// lib/supabase/client.ts

"use client";

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/types/supabase";

// This is the client-side Supabase client.
// It's used in client components and is browser-safe.
export const createClient = () =>
  createClientComponentClient<Database>({
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  });

// Export the type for use in components
export type SupabaseClient = ReturnType<typeof createClient>;