// app/dashboard/layout.tsx

import { redirect } from "next/navigation";
import { createServer } from "@/lib/supabase/server";

export default async function DashboardLayout({
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

  // If the user is logged in, render the children (the dashboard page)
  return <>{children}</>;
}