// components/theme-provider.tsx
"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
// --- THIS IS THE FIX ---
// The ThemeProviderProps type is now imported directly from the main package.
import { type ThemeProviderProps } from "next-themes";

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}