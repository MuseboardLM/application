// app/(private)/museboard/layout.tsx

import { redirect } from "next/navigation";
import { createServer } from "@/lib/supabase/server";
import Header from "@/components/common/header";

export default async function MuseboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  return (
    <div className="relative flex min-h-screen flex-col">
      <Header />
      {/* --- THIS IS THE FIX --- */}
      {/* We wrap the children in a container div that provides the constrained, 
          centered width that the MuseboardClientWrapper's JavaScript expects. */}
      <main className="flex-1">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}