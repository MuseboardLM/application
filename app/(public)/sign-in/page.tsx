// app/sign-in/page.tsx

import { AuthCard } from "@/components/auth/auth-card";
import { LoginForm } from "@/components/auth/login-form";
import { CardContainer } from "@/components/ui/card-container";

export default function SignInPage() {
  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center p-8">
      <CardContainer className="w-full max-w-md">
        <AuthCard
          headerLabel="Welcome to MBLM"
          subHeaderLabel="Don't have an account?"
          backButtonLabel="Sign up for free"
          backButtonHref="/sign-up"
        >
          <LoginForm />
        </AuthCard>
      </CardContainer>
    </div>
  );
}
