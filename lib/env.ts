import { z } from "zod";

// Define the schema for environment variables
const envSchema = z.object({
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().url("Invalid Supabase URL"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, "Supabase anon key is required"),
  
  // Node Environment
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  
  // Next.js
  NEXT_PUBLIC_APP_URL: z.string().url("Invalid app URL").optional(),
});

// Parse and validate environment variables (only when called)
function validateEnv() {
  try {
    const env = envSchema.parse({
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      NODE_ENV: process.env.NODE_ENV,
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    });

    return env;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("❌ Invalid environment variables:");
      error.errors.forEach((err) => {
        console.error(`  ${err.path.join(".")}: ${err.message}`);
      });
      
      // Don't exit process, just return null
      return null;
    }
    throw error;
  }
}

// Only validate when explicitly called (not at import time)
export const getEnv = () => {
  const env = validateEnv();
  if (!env) {
    throw new Error("Environment validation failed");
  }
  return env;
};

// For development, you can call this to check env vars
export const checkEnv = () => {
  const env = validateEnv();
  if (env) {
    console.log("✅ Environment variables are valid");
  }
  return env;
};