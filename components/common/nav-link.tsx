"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, ReactNode } from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

type NavLinkProps = {
  href: string;
  children: ReactNode;
  onClick?: () => void;
};

export default function NavLink({ href, children, onClick }: NavLinkProps) {
  const pathname = usePathname();
  const [currentHash, setCurrentHash] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Set initial hash
    setCurrentHash(window.location.hash);

    const handleHashChange = () => {
      setCurrentHash(window.location.hash);
    };

    window.addEventListener("hashchange", handleHashChange);

    return () => {
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, []);

  // Don't render active state until mounted to avoid hydration mismatch
  if (!mounted) {
    return (
      <Link
        href={href}
        className="relative transition hover:text-primary"
        onClick={onClick}
      >
        {children}
      </Link>
    );
  }

  const [linkPath, linkHash] = href.split("#");
  let isActive = false;

  if (linkHash) {
    // Hash link like "/#pricing"
    const pathMatches = (linkPath || "/") === pathname;
    const hashMatches = currentHash === `#${linkHash}`;
    isActive = pathMatches && hashMatches;
  } else {
    // Regular link
    if (href === "/") {
      // Root link is active only when on root path with no hash
      isActive = pathname === "/" && currentHash === "";
    } else {
      // Other links match exactly
      isActive = pathname === href;
    }
  }

  const classes = twMerge(
    clsx(
      "relative transition hover:text-primary",
      "after:absolute after:left-0 after:-bottom-0.5 after:h-px after:bg-gradient-to-r after:from-primary after:to-primary/80 after:transition-all after:duration-150 after:shadow-sm after:shadow-primary/30",
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
