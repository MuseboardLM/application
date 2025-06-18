"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, ReactNode } from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * A custom hook to safely access window.location.hash on the client.
 * It returns the hash value only after the component has mounted.
 * This avoids server-client hydration mismatches.
 */
function useClientHash() {
  const [hash, setHash] = useState("");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);

    const handleHashChange = () => {
      setHash(window.location.hash);
    };

    // Set the initial hash
    handleHashChange();

    window.addEventListener("hashchange", handleHashChange);
    return () => {
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, []);

  // Only return the hash if the component is mounted on the client
  return isMounted ? hash : "";
}

type NavLinkProps = {
  href: string;
  children: ReactNode;
  onClick?: () => void; // Optional onClick handler
};

export default function NavLink({ href, children, onClick }: NavLinkProps) {
  const pathname = usePathname();
  const clientHash = useClientHash();

  const [linkPath, linkHash] = href.split("#");

  // Determine if the link is active
  let isActive = false;
  if (linkHash) {
    // It's a hash link (e.g., "/#pricing")
    // Active if the path matches and the client hash matches
    const pathMatches = (linkPath || "/") === pathname;
    const hashMatches = clientHash === `#${linkHash}`;
    isActive = pathMatches && hashMatches;
  } else {
    // It's a regular link (e.g., "/sign-in")
    if (href === "/") {
      // The root link is only active on the exact root path
      isActive = pathname === "/";
    } else {
      // Other links are active if the current path starts with the href
      isActive = pathname.startsWith(href);
    }
  }

  // Use twMerge and clsx for robust and clean class name management
  const classes = twMerge(
    clsx(
      "relative transition hover:text-primary",
      "after:absolute after:left-0 after:-bottom-0.5 after:h-px after:bg-black after:transition-all after:duration-150",
      {
        "text-primary after:w-full": isActive,
        "after:w-0 hover:after:w-full": !isActive,
      }
    )
  );

  return (
    <Link href={href} className={classes} onClick={onClick}>
      {children}
    </Link>
  );
}
