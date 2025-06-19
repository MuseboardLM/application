// components/auth/login-form.tsx

"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Apple, LogIn } from "lucide-react";
import Link from "next/link";
import { GoogleIcon } from "@/components/common/icons";

export function LoginForm({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-col", className)}>
      <div className="text-center mb-8">
        {/* SOFTER HEADER: Changed from text-foreground to text-secondary-foreground
            for a slightly softer white that looks more premium and less stark. */}
        <h1 className="text-3xl font-semibold tracking-tight text-secondary-foreground mb-2">
          Welcome to MBLM
        </h1>
        <p className="text-sm text-muted-foreground">
          Don't have an account?{" "}
          <Link
            href="/sign-up"
            className="font-medium text-primary hover:text-primary/90 underline-offset-4 hover:underline"
          >
            Sign up for free
          </Link>
        </p>
      </div>

      <form className="space-y-4">
        <div className="space-y-2">
          <label
            htmlFor="email"
            className="text-sm font-medium text-muted-foreground"
          >
            Username or Email
          </label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            required
          />
        </div>
        <div className="space-y-2">
          <label
            htmlFor="password"
            className="text-sm font-medium text-muted-foreground"
          >
            Password
          </label>
          <Input id="password" type="password" required />
        </div>
        <Button type="submit" className="w-full !mt-6" size="lg">
          <LogIn className="mr-2 h-4 w-4" />
          Log In
        </Button>
      </form>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-2 text-muted-foreground">Or</span>
        </div>
      </div>

      <div className="space-y-3">
        <Button variant="secondary" className="w-full">
          <GoogleIcon className="mr-2 h-5 w-5" />
          Log in with Google
        </Button>
        <Button variant="secondary" className="w-full">
          <Apple className="mr-2 h-5 w-5" />
          Log in with Apple
        </Button>
        <Button variant="secondary" className="w-full">
          Use Single Sign-On (SSO)
        </Button>
      </div>

      {/* TIGHTER SPACING: Reduced top margin from mt-6 to mt-4 to feel more connected. */}
      <div className="mt-4 text-center">
        <Link
          href="/forgot-password"
          className="text-sm text-muted-foreground underline-offset-4 hover:underline hover:text-primary"
        >
          Forgot Password
        </Link>
      </div>
    </div>
  );
}
