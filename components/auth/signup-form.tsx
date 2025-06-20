// components/auth/signup-form.tsx

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation"; // Use 'next/navigation' in App Router
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react"; // For loading spinner

export function SignUpForm() {
  // State for form inputs
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // State for loading and error messages
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const supabase = createClient();

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // This is a crucial step for the user flow.
        // It tells Supabase where to redirect the user after they confirm their email.
        emailRedirectTo: `${location.origin}/auth/callback`,
      },
    });

    setIsLoading(false);

    if (error) {
      setError(error.message);
    } else {
      // By default, Supabase sends a confirmation email.
      // You can inform the user that they need to check their inbox.
      // A common practice is to redirect to a "check your email" page.
      // For now, we'll just refresh to show we can handle the success state.
      setError("Please check your email to confirm your sign-up."); // Using error state for success message for simplicity
      router.refresh();
    }
  };

  return (
    <form onSubmit={handleSignUp} className="space-y-4">
      <div className="space-y-2">
        <label
          htmlFor="email"
          className="text-sm font-medium text-muted-foreground"
        >
          Email
        </label>
        <Input
          id="email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={isLoading} // Disable input when loading
        />
      </div>
      <div className="space-y-2">
        <label
          htmlFor="password"
          className="text-sm font-medium text-muted-foreground"
        >
          Password
        </label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={isLoading} // Disable input when loading
        />
      </div>

      {/* Display error message if it exists */}
      {error && (
        <p className="text-sm text-red-500 bg-red-500/10 p-2 rounded-md">
          {error}
        </p>
      )}

      <Button
        type="submit"
        className="w-full !mt-6 cursor-pointer" // <-- UPDATED
        size="lg"
        disabled={isLoading} // Disable button when loading
      >
        {isLoading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          "Create account"
        )}
      </Button>
    </form>
  );
}
