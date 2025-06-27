// app/layout.tsx

import type { Metadata } from "next";
import { Source_Sans_3 as FontSans } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner"; // Make sure the Toaster is here

const fontSans = FontSans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "MBLM - Re-shape your thinking.",
  description:
    "Keep your mission, dreams, and goals front of mind. All the time.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${fontSans.variable} font-sans antialiased bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster position="top-center" richColors />
        </ThemeProvider>
      </body>
    </html>
  );
}