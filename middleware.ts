// middleware.ts

import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Define protected routes that require authentication
const protectedRoutes = ["/museboard", "/dashboard", "/trash", "/onboarding"];

// Define public routes that don't require authentication
const publicRoutes = ["/", "/sign-in", "/sign-up", "/forgot-password"];

// Define auth routes that should redirect authenticated users
const authRoutes = ["/sign-in", "/sign-up", "/forgot-password"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Create a response object that we can modify
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // Create a Supabase client configured to use cookies
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          // If the cookie is updated, update the cookies for the request and response
          request.cookies.set({
            name,
            value,
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          // If the cookie is removed, update the cookies for the request and response
          request.cookies.set({
            name,
            value: "",
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value: "",
            ...options,
          });
        },
      },
    }
  );

  // Get the current user session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Check if the current path is protected
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Check if the current path is an auth route
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  // If user is not authenticated and trying to access protected route
  if (!user && isProtectedRoute) {
    const redirectUrl = new URL("/sign-in", request.url);
    // Add the original path as a redirect parameter
    redirectUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // If user is authenticated, check onboarding status
  if (user) {
    // Check if user has completed onboarding
    const { data: mission } = await supabase
      .from("user_missions")
      .select("onboarding_completed")
      .eq("user_id", user.id)
      .single();

    const hasCompletedOnboarding = mission?.onboarding_completed;

    // If user hasn't completed onboarding and isn't on onboarding page
    if (!hasCompletedOnboarding && pathname !== "/onboarding") {
      // Don't redirect if they're on auth routes (let them sign out if needed)
      if (!isAuthRoute) {
        return NextResponse.redirect(new URL("/onboarding", request.url));
      }
    }

    // If user has completed onboarding and is trying to access onboarding
    if (hasCompletedOnboarding && pathname === "/onboarding") {
      return NextResponse.redirect(new URL("/museboard", request.url));
    }

    // If user is authenticated and trying to access auth routes
    if (isAuthRoute) {
      // Check if there's a redirect parameter
      const redirectTo = request.nextUrl.searchParams.get("redirectTo");
      if (redirectTo) {
        return NextResponse.redirect(new URL(redirectTo, request.url));
      }
      // Default redirect based on onboarding status
      const defaultRedirect = hasCompletedOnboarding ? "/museboard" : "/onboarding";
      return NextResponse.redirect(new URL(defaultRedirect, request.url));
    }
  }

  return response;
}

// Configure which routes this middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    "/((?!api|_next/static|_next/image|favicon.ico|public).*)",
  ],
};