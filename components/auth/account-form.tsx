// components/auth/account-form.tsx
"use client";

import { useState, useEffect } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Separator } from "@/components/ui/separator";

type Profile = {
  full_name: string | null;
  avatar_url: string | null;
};

interface AccountFormProps {
  user: User;
  profile: Profile | null;
}

export function AccountForm({ user, profile }: AccountFormProps) {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; content: string } | null>(null);
  const [fullName, setFullName] = useState<string>("");

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "");
    }
  }, [profile]);

  async function updateProfile() {
    setLoading(true);
    setMessage(null);

    const { error } = await supabase.from("profiles").upsert({
      id: user.id,
      full_name: fullName,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      setMessage({ type: "error", content: error.message });
    } else {
      setMessage({ type: "success", content: "Profile updated successfully!" });
    }

    setLoading(false);
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-medium text-muted-foreground">
          Email
        </label>
        <Input id="email" type="text" value={user.email} disabled />
      </div>
      <div className="space-y-2">
        <label htmlFor="fullName" className="text-sm font-medium text-muted-foreground">
          Full Name
        </label>
        <Input
          id="fullName"
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />
      </div>

      <div>
        <Button
          onClick={updateProfile}
          className="w-full cursor-pointer"
          disabled={loading}
          size="lg"
        >
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Update Profile"}
        </Button>
      </div>

      {message && (
        <p
          className={`mt-4 text-center text-sm p-2 rounded-md ${
            message.type === "success"
              ? "bg-green-500/10 text-green-500"
              : "bg-red-500/10 text-red-500"
          }`}
        >
          {message.content}
        </p>
      )}

      <Separator />

      <div className="space-y-2">
        <label className="text-sm font-medium text-muted-foreground">
          Theme
        </label>
        {/* --- THIS IS THE CHANGE --- */}
        {/* Removed `border` and added a subtle background color for separation */}
        <div className="flex items-center justify-between p-2 rounded-md bg-muted/50">
            <p className="text-sm text-foreground">
                Interface theme
            </p>
            <ThemeToggle />
        </div>
      </div>
    </div>
  );
}