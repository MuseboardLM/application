// app/forgot-password/page.tsx

import { AuthCard } from "@/components/auth/auth-card";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { CardContainer } from "@/components/ui/card-container";

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center p-8">
      <CardContainer className="w-full max-w-md">
        <AuthCard
          headerLabel="Forgot your password?"
          subHeaderLabel="We'll send a password reset link to your email."
          backButtonLabel="Back to log in"
          backButtonHref="/sign-in"
          showSocial={false} // We don't need social logins here
        >
          <ForgotPasswordForm />
        </AuthCard>
      </CardContainer>
    </div>
  );
}
