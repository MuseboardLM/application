// components/auth/auth-card.tsx

import Link from "next/link";
import { Apple } from "lucide-react";

import { CardContainer } from "@/components/ui/card-container";
import { Button } from "@/components/ui/button";
import { GoogleIcon } from "@/components/common/icons";

// Define the props for our flexible AuthCard component
interface AuthCardProps {
  children: React.ReactNode;
  headerLabel: string;
  subHeaderLabel: string;
  backButtonLabel: string;
  backButtonHref: string;
  showSocial?: boolean; // Optional prop to show/hide social logins
}

export function AuthCard({
  children,
  headerLabel,
  subHeaderLabel,
  backButtonLabel,
  backButtonHref,
  showSocial = true, // Default to true
}: AuthCardProps) {
  return (
    <div className="flex flex-col">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-secondary-foreground mb-2">
          {headerLabel}
        </h1>
        <p className="text-sm text-muted-foreground">
          {subHeaderLabel}{" "}
          <Link
            href={backButtonHref}
            className="font-medium text-primary hover:text-primary/90 underline-offset-4 hover:underline"
          >
            {backButtonLabel}
          </Link>
        </p>
      </div>

      {children}

      {showSocial && (
        <>
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
        </>
      )}
    </div>
  );
}
