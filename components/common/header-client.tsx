// components/common/header-client.tsx

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Crop, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import NavLink from "./nav-link";
import IridescentIcon from "@/components/ui/iridescent-icon";
import type { User } from "@supabase/supabase-js";

type NavLinkType = {
  href: string;
  label: string;
  isButton?: boolean;
};

interface HeaderClientProps {
  user: User | null;
  logOut: () => Promise<void>;
}

export default function HeaderClient({ user, logOut }: HeaderClientProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen);
  const closeMobileMenu = () => setMobileMenuOpen(false);

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [mobileMenuOpen]);

  const loggedOutLinks: NavLinkType[] = [
    { href: "/", label: "Overview" },
    { href: "/#pricing", label: "Pricing" },
    { href: "/sign-in", label: "Try MBLM", isButton: true },
  ];

  // --- THIS IS THE CHANGE ---
  // We've removed the "Overview" and "Pricing" links for logged-in users
  // to create a more focused application experience.
  const loggedInLinks: NavLinkType[] = [
    { href: "/dashboard", label: "Dashboard" },
  ];

  const navLinks = user ? loggedInLinks : loggedOutLinks;

  return (
    <header className="sticky top-0 w-full bg-background/80 backdrop-blur-sm z-50">
      <div className="relative flex items-center justify-between px-6 lg:px-8 py-4 border-b border-border/50">
        <div className="flex-1">
          <Link
            href="/"
            onClick={closeMobileMenu}
            className="-m-1.5 p-1.5 flex items-center gap-2 group"
          >
            <span className="sr-only">MBLM</span>
            <IridescentIcon
              icon={Crop}
              className="icon-iridescent h-6 w-6 transition-transform duration-200 group-hover:rotate-12"
            />
            <span className="font-bold text-2xl text-foreground">MBLM</span>
          </Link>
        </div>

        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) =>
            link.isButton ? (
              <Button
                key={link.href}
                variant="white"
                asChild
                className="px-6 py-2.5 rounded-xl text-sm font-semibold"
              >
                <Link href={link.href}>{link.label}</Link>
              </Button>
            ) : (
              <NavLink key={link.href} href={link.href}>
                {link.label}
              </NavLink>
            )
          )}
          {user && (
            <form action={logOut}>
              <Button
                type="submit"
                variant="ghost"
                className="px-4 py-2.5 rounded-xl text-sm font-semibold cursor-pointer"
              >
                Log Out
              </Button>
            </form>
          )}
        </nav>

        <div className="flex flex-1 justify-end md:hidden">
          <button
            type="button"
            onClick={toggleMobileMenu}
            aria-controls="mobile-menu"
            aria-expanded={mobileMenuOpen}
            className="-m-2.5 p-2.5 text-foreground hover:text-primary transition-colors z-50 relative"
          >
            <span className="sr-only">Open main menu</span>
            {mobileMenuOpen ? (
              <X className="h-6 w-6" aria-hidden="true" />
            ) : (
              <Menu className="h-6 w-6" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      <div
        id="mobile-menu"
        data-open={mobileMenuOpen}
        className="
          absolute top-full left-0 w-full z-40
          md:hidden
          border-b border-border/50
          bg-background/95 backdrop-blur-lg
          p-6
          flex flex-col gap-6
          transition-all duration-300 ease-in-out
          opacity-0 -translate-y-4 pointer-events-none
          data-[open=true]:opacity-100 data-[open=true]:translate-y-0 data-[open=true]:pointer-events-auto
        "
      >
        <nav className="flex flex-col items-start gap-4">
          {navLinks.map((link) =>
            !link.isButton ? (
              <NavLink
                key={link.href}
                href={link.href}
                onClick={closeMobileMenu}
                className="text-lg w-fit"
              >
                {link.label}
              </NavLink>
            ) : null
          )}
        </nav>
        {navLinks.find((link) => link.isButton) && (
          <Button
            variant="white"
            asChild
            className="w-full px-6 py-3 rounded-xl text-base font-semibold"
          >
            <Link href="/sign-in" onClick={closeMobileMenu}>
              Try MBLM
            </Link>
          </Button>
        )}
        {user && (
          <form action={logOut} className="w-full">
            <Button
              type="submit"
              variant="secondary"
              className="w-full cursor-pointer"
              onClick={closeMobileMenu}
            >
              Log Out
            </Button>
          </form>
        )}
      </div>
    </header>
  );
}