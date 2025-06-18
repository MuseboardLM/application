"use client";

import { useState } from "react";
import Link from "next/link";
import { Crop, Menu, X } from "lucide-react";
import NavLink from "./nav-link";

const navLinks = [
  { href: "/", label: "Overview" },
  { href: "/#pricing", label: "Pricing" },
  { href: "/sign-in", label: "Try MuseboardLM", isButton: true },
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
    <header className="relative w-full flex items-center justify-between px-6 lg:px-8 py-6 bg-background border-b border-border/50">
      <div className="flex-1">
        <Link
          href="/"
          className="-m-1.5 p-1.5 flex items-center gap-2"
          onClick={closeMobileMenu}
        >
          <span className="sr-only">MuseboardLM</span>
          <Crop className="h-6 w-6 text-primary hover:rotate-12 transition duration-200" />
          <span className="font-bold text-2xl text-foreground">
            MuseboardLM
          </span>
        </Link>
      </div>

      {/* Desktop Nav */}
      <nav className="hidden md:flex items-center gap-6">
        {navLinks.map((link) =>
          link.isButton ? (
            <Link
              key={link.href}
              href={link.href}
              className="px-6 py-2.5 bg-primary hover:bg-primary/90 rounded-full text-sm font-semibold text-primary-foreground transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-primary/25"
            >
              {link.label}
            </Link>
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
          className="-m-2.5 p-2.5 text-foreground hover:text-primary transition-colors"
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

      {/* Mobile Menu Panel */}
      {mobileMenuOpen && (
        <div
          id="mobile-menu"
          className="absolute top-full left-0 w-full bg-card border-t border-border/50 px-4 py-4 flex flex-col gap-4 md:hidden backdrop-blur-xl"
        >
          {navLinks.map((link) =>
            link.isButton ? (
              <Link
                key={link.href}
                href={link.href}
                onClick={closeMobileMenu}
                className="block w-full text-center px-6 py-3 bg-primary hover:bg-primary/90 rounded-full text-base font-semibold text-primary-foreground transition-all duration-200"
              >
                {link.label}
              </Link>
            ) : (
              <NavLink
                key={link.href}
                href={link.href}
                onClick={closeMobileMenu}
              >
                {link.label}
              </NavLink>
            )
          )}
        </div>
      )}
    </header>
  );
}
