"use client";

import { useState } from "react";
import Link from "next/link";
import { Crop, Menu } from "lucide-react";
import NavLink from "./nav-link";

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="w-full flex items-center justify-between px-6 lg:px-8 py-6">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2">
        <Crop className="h-6 w-6 text-black hover:rotate-12 transition duration-200" />
        <span className="font-bold text-2xl text-black">MuseboardLM</span>
      </Link>

      {/* Desktop Nav */}
      <div className="hidden md:flex gap-6">
        <NavLink href="/">Overview</NavLink>
        <NavLink href="/#pricing">Pricing</NavLink>
        <NavLink href="/sign-in">Sign in</NavLink>
      </div>

      {/* Mobile Menu Button */}
      <button
        className="md:hidden"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
      >
        <Menu className="h-6 w-6 text-black" />
      </button>

      {/* Mobile Menu Panel */}
      {mobileMenuOpen && (
        <div className="absolute top-16 left-0 w-full bg-white border-t px-4 py-4 flex flex-col gap-4 md:hidden">
          <NavLink href="/">Overview</NavLink>
          <NavLink href="/#pricing">Pricing</NavLink>
          <NavLink href="/sign-in">Sign in</NavLink>
        </div>
      )}
    </nav>
  );
}
