// app/auth/update-password/page.tsx

import { AuthCard } from "@/components/auth/auth-card";
import { UpdatePasswordForm } from "@/components/auth/update-password-form";
import { CardContainer } from "@/components/ui/card-container";

export default function UpdatePasswordPage() {
  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center p-8">
      <CardContainer className="w-full max-w-md">
        <AuthCard
          headerLabel="Choose a new password"
          subHeaderLabel="Strong passwords include numbers, letters, and symbols."
          backButtonLabel="Back to log in"
          backButtonHref="/sign-in"
          showSocial={false} // Social logins are not needed here
        >
          <UpdatePasswordForm />
        </AuthCard>
      </CardContainer>
    </div>
  );
}
