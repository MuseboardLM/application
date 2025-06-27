// app/layout.tsx

import type { Metadata } from "next";
import { Source_Sans_3 as FontSans } from "next/font/google";
import "./globals.css";
import Header from "@/components/common/header";
import Footer from "@/components/common/footer";
import AnimatedBackground from "@/components/common/animated-background"; // <-- IMPORT

const fontSans = FontSans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "MBLM - Re-shape your thinking.", // I took the liberty of using your logo name
  description:
    "Keep your mission, dreams, and goals front of mind. All the time.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${fontSans.variable} font-sans antialiased bg-background text-foreground`}
      >
        <div className="relative flex min-h-screen flex-col">
          {/* REMOVED aurora-background class, as our new component handles it */}
          <AnimatedBackground /> {/* <-- ADDED a-background */}
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
