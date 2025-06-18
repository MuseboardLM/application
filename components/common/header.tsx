"use client";

import { useState } from "react";
import Link from "next/link";
import { Crop, Menu, X } from "lucide-react";
import NavLink from "./nav-link";

// --- CHANGE 1: Update the data structure to identify button links ---
// We add an optional `isButton` property.
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
    <header className="relative w-full flex items-center justify-between px-6 lg:px-8 py-6">
      <div className="flex-1">
        <Link
          href="/"
          className="-m-1.5 p-1.5 flex items-center gap-2"
          onClick={closeMobileMenu}
        >
          <span className="sr-only">MuseboardLM</span>
          <Crop className="h-6 w-6 text-black hover:rotate-12 transition duration-200" />
          <span className="font-bold text-2xl text-black">MuseboardLM</span>
        </Link>
      </div>

      {/* --- CHANGE 2: Add `items-center` for vertical alignment --- */}
      {/* Desktop Nav */}
      <nav className="hidden md:flex items-center gap-6">
        {navLinks.map((link) =>
          // --- CHANGE 3: Conditionally render a button or a NavLink ---
          link.isButton ? (
            <Link
              key={link.href}
              href={link.href}
              className="px-4 py-1.5 border border-black rounded-full text-sm font-semibold text-black hover:bg-black hover:text-white transition-colors duration-200"
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
          className="-m-2.5 p-2.5"
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
          className="absolute top-full left-0 w-full bg-white border-t px-4 py-4 flex flex-col gap-4 md:hidden"
        >
          {navLinks.map((link) =>
            // --- CHANGE 4: Apply the same conditional logic to the mobile menu ---
            link.isButton ? (
              <Link
                key={link.href}
                href={link.href}
                onClick={closeMobileMenu} // Important for UX
                className="block w-full text-center px-4 py-2 border border-black rounded-full text-base font-semibold text-black hover:bg-black hover:text-white transition-colors duration-200"
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
