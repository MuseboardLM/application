// lib/supabase/client.ts

"use client";

// CORRECTED IMPORT: We are now using 'createClientComponentClient'
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

// This is the client-side Supabase client.
// It's used in client components and is browser-safe.
export const createClient = () =>
  // CORRECTED FUNCTION CALL
  createClientComponentClient({
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  });
