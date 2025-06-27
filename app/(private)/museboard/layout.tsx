// app/(private)/museboard/layout.tsx

import { redirect } from "next/navigation";
import { createServer } from "@/lib/supabase/server";
import Header from "@/components/common/header"; // Import the Header component

export default async function MuseboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If the user is not logged in, redirect them to the sign-in page
  if (!user) {
    redirect("/sign-in");
  }

  // Render the main page structure for authenticated users.
  // This includes the Header and a 'main' content area but excludes the Footer.
  return (
    <div className="relative flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">{children}</main>
    </div>
  );
}