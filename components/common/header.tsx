"use client";

import { useState } from "react";
import Link from "next/link";
import { Crop, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import NavLink from "./nav-link";

const navLinks = [
  { href: "/", label: "Overview" },
  { href: "/#pricing", label: "Pricing" },
  { href: "/sign-in", label: "Try MBLM", isButton: true },
];

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <header className="relative w-full flex items-center justify-between px-6 lg:px-8 py-6 bg-background border-b border-border/50 z-50">
      <div className="flex-1">
        <Link
          href="/"
          className="-m-1.5 p-1.5 flex items-center gap-2"
          onClick={closeMobileMenu}
        >
          <span className="sr-only">MuseboardLM</span>
          <Crop className="h-6 w-6 text-primary hover:rotate-12 transition duration-200" />
          <span className="font-bold text-2xl text-foreground">MBLM</span>
        </Link>
      </div>

      {/* Desktop Nav */}
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
      </nav>

      {/* Mobile Menu Button */}
      <div className="flex flex-1 justify-end md:hidden">
        <button
          type="button"
          className="-m-2.5 p-2.5 text-foreground hover:text-primary transition-colors z-50 relative"
          onClick={toggleMobileMenu}
          aria-controls="mobile-menu"
          aria-expanded={mobileMenuOpen}
        >
          <span className="sr-only">Open main menu</span>
          {mobileMenuOpen ? (
            <X className="h-6 w-6" aria-hidden="true" />
          ) : (
            <Menu className="h-6 w-6" aria-hidden="true" />
          )}
        </button>
      </div>

      {/* Mobile Menu Panel -- REFACTORED SECTION -- */}
      <div
        id="mobile-menu"
        className={`
          absolute top-full left-0 w-full bg-card/95 backdrop-blur-xl border-t border-border/50 
          px-4 py-4 flex flex-col gap-4 md:hidden z-40 shadow-lg 
          transition-all duration-200 ease-in-out
          ${mobileMenuOpen ? "opacity-100" : "opacity-0"}
          ${mobileMenuOpen ? "translate-y-0" : "-translate-y-2"}
          ${mobileMenuOpen ? "pointer-events-auto" : "pointer-events-none"}
        `}
      >
        {navLinks.map((link) =>
          link.isButton ? (
            <Button
              key={link.href}
              variant="white"
              asChild
              className="w-full px-6 py-3 rounded-xl text-base font-semibold"
            >
              <Link href={link.href} onClick={closeMobileMenu}>
                {link.label}
              </Link>
            </Button>
          ) : (
            <NavLink key={link.href} href={link.href} onClick={closeMobileMenu}>
              {link.label}
            </NavLink>
          )
        )}
      </div>
    </header>
  );
}
