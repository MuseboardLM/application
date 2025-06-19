// app/sign-in/page.tsx

import { LoginForm } from "@/components/auth/login-form";
import { CardContainer } from "@/components/ui/card-container";

export default function SignInPage() {
  return (
    // This outer div perfectly centers the card vertically and horizontally
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center p-8">
      {/* 
        MORE PADDING: Increased from p-4 to p-8 to give the 'glow-primary'
        box-shadow enough space to be visible without being clipped by the viewport.
      */}
      <CardContainer className="w-full max-w-md">
        <LoginForm />
      </CardContainer>
    </div>
  );
}
