"use client";

import { useState } from "react";
import Link from "next/link";
import { Crop, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import NavLink from "./nav-link";
import IridescentIcon from "@/components/ui/iridescent-icon";

const navLinks = [
  { href: "/", label: "Overview" },
  { href: "/#pricing", label: "Pricing" },
  { href: "/sign-in", label: "Try MBLM", isButton: true },
];

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen);
  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <header className="relative w-full flex items-center justify-between px-6 lg:px-8 py-6 bg-background border-b border-border/50 z-50">
      {/* ── Brand ─────────────────────────────────────────────── */}
      <div className="flex-1">
        <Link
          href="/"
          onClick={closeMobileMenu}
          className="-m-1.5 p-1.5 flex items-center gap-2 group"
        >
          <span className="sr-only">MBLM</span>

          {/* hologram icon with stroke-flow + rotate */}
          <IridescentIcon
            icon={Crop}
            className="icon-iridescent h-6 w-6 transition-transform duration-200 group-hover:rotate-12"
          />

          <span className="font-bold text-2xl text-foreground">MBLM</span>
        </Link>
      </div>

      {/* ── Desktop Nav ───────────────────────────────────────── */}
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

      {/* ── Mobile Toggle ─────────────────────────────────────── */}
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

      {/* ── Mobile Panel ──────────────────────────────────────── */}
      <div
        id="mobile-menu"
        data-open={mobileMenuOpen}
        className="
          absolute top-full left-0 w-full bg-card/95 backdrop-blur-xl border-t border-border/50
          px-4 py-4 flex flex-col gap-4 md:hidden z-40 shadow-lg
          transition-all duration-200 ease-in-out
          opacity-0 -translate-y-2 pointer-events-none
          data-[open=true]:opacity-100 data-[open=true]:translate-y-0 data-[open=true]:pointer-events-auto
        "
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
