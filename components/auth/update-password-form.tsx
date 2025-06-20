// components/auth/update-password-form.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";

export function UpdatePasswordForm() {
  const [newPassword, setNewPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();

  const supabase = createClient();

  const handleUpdatePassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    setIsLoading(false);

    if (error) {
      setMessage(error.message);
    } else {
      setMessage("Your password has been updated successfully.");
      // Redirect to dashboard after a short delay
      setTimeout(() => {
        router.push("/dashboard"); // <-- UPDATED
      }, 2000);
    }
  };

  return (
    <form onSubmit={handleUpdatePassword} className="space-y-4">
        {/* ...form content remains the same... */}
        <div className="space-y-2">
            <label
            htmlFor="new-password"
            className="text-sm font-medium text-muted-foreground"
            >
            New Password
            </label>
            <Input
            id="new-password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            disabled={isLoading}
            />
        </div>

        {message && (
            <p className="text-sm text-foreground bg-foreground/10 p-2 rounded-md">
            {message}
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
            "Update Password"
            )}
        </Button>
    </form>
  );
}