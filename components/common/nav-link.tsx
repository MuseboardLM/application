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
        className="relative transition hover:text-primary text-base font-medium py-2 block md:inline-block md:py-0 w-fit"
        onClick={onClick}
      >
        {children}
      </Link>
    );
  }

  const [linkPath, linkHash] = href.split("#");
  let isActive = false;

  if (linkHash) {
    // Hash link like "/#pricing" - only active if both path and hash match
    const pathMatches = (linkPath || "/") === pathname;
    const hashMatches = currentHash === `#${linkHash}`;
    isActive = pathMatches && hashMatches;
  } else {
    // Regular link
    if (href === "/") {
      // Root link is active when on root path with no hash OR when no current hash exists
      isActive = pathname === "/" && (!currentHash || currentHash === "");
    } else {
      // Other links match exactly and no hash should be present
      isActive = pathname === href && (!currentHash || currentHash === "");
    }
  }

  const classes = twMerge(
    clsx(
      "relative transition hover:text-primary text-base font-medium py-2 block md:inline-block md:py-0 w-fit",
      "after:absolute after:left-0 after:-bottom-0 md:after:-bottom-0.5 after:h-px after:bg-gradient-to-r after:from-primary after:to-primary/80 after:transition-all after:duration-150 after:shadow-sm after:shadow-primary/30",
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
