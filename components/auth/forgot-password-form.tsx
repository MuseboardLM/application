// components/auth/forgot-password-form.tsx

"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  // Use separate state for clarity
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const supabase = createClient();

  const handlePasswordReset = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${location.origin}/auth/update-password`,
    });

    setIsLoading(false);

    if (error) {
      setError(error.message);
    } else {
      setSuccessMessage("Password reset link has been sent to your email.");
    }
  };

  return (
    <form onSubmit={handlePasswordReset} className="space-y-4">
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
          disabled={isLoading}
        />
      </div>

      {/* Display Success Message (Green) */}
      {successMessage && (
        <p className="text-sm text-green-500 bg-green-500/10 p-2 rounded-md">
          {successMessage}
        </p>
      )}

      {/* Display Error Message (Red) */}
      {error && (
        <p className="text-sm text-red-500 bg-red-500/10 p-2 rounded-md">
          {error}
        </p>
      )}

      <Button
        type="submit"
        className="w-full !mt-6 cursor-pointer"
        size="lg"
        disabled={isLoading}
      >
        {isLoading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          "Send password reset link"
        )}
      </Button>
    </form>
  );
}
