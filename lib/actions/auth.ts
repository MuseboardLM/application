// lib/actions/auth.ts


"use server";

import { createServer } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

// Validation schemas
const EmailSchema = z.string().email("Please enter a valid email address");
const PasswordSchema = z.string().min(6, "Password must be at least 6 characters");

const SignInSchema = z.object({
  email: EmailSchema,
  password: PasswordSchema,
});

const SignUpSchema = z.object({
  email: EmailSchema,
  password: PasswordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const ResetPasswordSchema = z.object({
  email: EmailSchema,
});

export type AuthResult = {
  success: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
};

/**
 * Sign in with email and password
 */
export async function signInAction(prevState: any, formData: FormData): Promise<AuthResult> {
  const rawData = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  const validation = SignInSchema.safeParse(rawData);
  if (!validation.success) {
    return {
      success: false,
      error: "Please check your input",
      fieldErrors: validation.error.flatten().fieldErrors as Record<string, string>,
    };
  }

  try {
    const supabase = createServer();
    const { error } = await supabase.auth.signInWithPassword(validation.data);

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    revalidatePath("/", "layout");
    redirect("/museboard");
  } catch (error) {
    return {
      success: false,
      error: "An unexpected error occurred",
    };
  }
}

/**
 * Sign up with email and password
 */
export async function signUpAction(prevState: any, formData: FormData): Promise<AuthResult> {
  const rawData = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
    confirmPassword: formData.get("confirmPassword") as string,
  };

  const validation = SignUpSchema.safeParse(rawData);
  if (!validation.success) {
    return {
      success: false,
      error: "Please check your input",
      fieldErrors: validation.error.flatten().fieldErrors as Record<string, string>,
    };
  }

  try {
    const supabase = createServer();
    const { error } = await supabase.auth.signUp({
      email: validation.data.email,
      password: validation.data.password,
    });

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
    };
  } catch (error) {
    return {
      success: false,
      error: "An unexpected error occurred",
    };
  }
}

/**
 * Sign out the current user
 */
export async function signOutAction(): Promise<AuthResult> {
  try {
    const supabase = createServer();
    const { error } = await supabase.auth.signOut();

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    revalidatePath("/", "layout");
    redirect("/");
  } catch (error) {
    return {
      success: false,
      error: "An unexpected error occurred",
    };
  }
}

/**
 * Send password reset email
 */
export async function resetPasswordAction(prevState: any, formData: FormData): Promise<AuthResult> {
  const rawData = {
    email: formData.get("email") as string,
  };

  const validation = ResetPasswordSchema.safeParse(rawData);
  if (!validation.success) {
    return {
      success: false,
      error: "Please enter a valid email address",
      fieldErrors: validation.error.flatten().fieldErrors as Record<string, string>,
    };
  }

  try {
    const supabase = createServer();
    const { error } = await supabase.auth.resetPasswordForEmail(validation.data.email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password`,
    });

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
    };
  } catch (error) {
    return {
      success: false,
      error: "An unexpected error occurred",
    };
  }
}