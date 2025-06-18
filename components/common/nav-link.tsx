"use client";

import Link from "next/link";
import { ReactNode, useEffect, useState } from "react";
import { usePathname } from "next/navigation";

/** Track window.location.hash (safe on client only) */
function useHash() {
  const [hash, setHash] = useState<string>("");
  useEffect(() => {
    const sync = () => setHash(window.location.hash);
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);
  return hash;
}

export default function NavLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const hash = useHash();

  /* ---------- active state ---------- */
  const [linkPath, linkHash] = href.split("#"); // "/#pricing" -> ["", "pricing"]
  const pathToMatch = linkPath || "/";

  const isActive = linkHash
    ? pathname === pathToMatch && hash === `#${linkHash}`
    : href === "/"
    ? pathname === "/"
    : pathname.startsWith(href);

  /* ---------- styles ---------- */
  const base =
    "relative transition after:absolute after:left-0 after:-bottom-0.5 after:h-px " +
    "after:bg-black after:w-0 after:transition-all after:duration-150 " +
    "hover:text-primary hover:after:w-full";

  return (
    <Link
      href={href}
      className={`${base} ${isActive && "text-primary after:w-full"}`}
    >
      {children}
    </Link>
  );
}
