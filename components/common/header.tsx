// components/common/header.tsx

import { createServer } from "@/lib/supabase/server"; // Our server component client
import { logOut } from "@/app/auth/actions/actions"; // Our logout server action
import HeaderClient from "./header-client"; // The new client component

export default async function Header() {
  // 1. Fetch the user session on the server
  const supabase = createServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 2. Pass user data and server action to the client component
  return <HeaderClient user={user} logOut={logOut} />;
}
