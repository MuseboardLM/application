// components/auth/account-form.tsx
"use client";

import { useState, useEffect } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CardContainer } from "@/components/ui/card-container";
import { Loader2 } from "lucide-react";

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
    <div className="flex flex-col items-center p-4 sm:p-8">
      <h1 className="text-3xl font-bold mb-8">Your Account</h1>
      <CardContainer className="w-full max-w-lg p-6 sm:p-8">
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

          {/* --- USERNAME FIELD REMOVED --- */}

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
        </div>
      </CardContainer>
    </div>
  );
}