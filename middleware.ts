import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Define protected routes that require authentication
const protectedRoutes = ["/museboard", "/dashboard", "/trash"];

// Define public routes that don't require authentication
const publicRoutes = ["/", "/sign-in", "/sign-up", "/forgot-password"];

// Define auth routes that should redirect authenticated users
const authRoutes = ["/sign-in", "/sign-up", "/forgot-password"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Create a response object that we can modify
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // Create a Supabase client configured to use cookies
  const supabase = createServerComponentClient({
    cookies: () => request.cookies,
  });

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

  // If user is authenticated and trying to access auth routes
  if (user && isAuthRoute) {
    // Check if there's a redirect parameter
    const redirectTo = request.nextUrl.searchParams.get("redirectTo");
    if (redirectTo) {
      return NextResponse.redirect(new URL(redirectTo, request.url));
    }
    // Default redirect to museboard for authenticated users
    return NextResponse.redirect(new URL("/museboard", request.url));
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