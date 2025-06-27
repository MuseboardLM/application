// app/sign-up/page.tsx

import { AuthCard } from "@/components/auth/auth-card";
import { SignUpForm } from "@/components/auth/signup-form";
import { CardContainer } from "@/components/ui/card-container";

export default function SignUpPage() {
  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center p-8">
      <CardContainer className="w-full max-w-md">
        <AuthCard
          headerLabel="Create an account"
          subHeaderLabel="Already have an account?"
          backButtonLabel="Log in"
          backButtonHref="/sign-in"
        >
          <SignUpForm />
        </AuthCard>
      </CardContainer>
    </div>
  );
}
