// components/common/header-client.tsx

"use client";

import { useState, useEffect, ReactNode } from "react";
import Link from "next/link";
import { Crop, Menu, X, LogOut, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import NavLink from "./nav-link";
import IridescentIcon from "@/components/ui/iridescent-icon";
import type { User } from "@supabase/supabase-js";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import SettingsDialog from "./SettingsDialog";

type NavLinkType = {
  href: string;
  label: string;
  isButton?: boolean;
};

type Profile = {
  full_name: string | null;
  avatar_url: string | null;
} | null;

interface HeaderClientProps {
  user: User | null;
  profile: Profile;
  logOut: () => Promise<void>;
  trashView: ReactNode;
}

export default function HeaderClient({ user, profile, logOut, trashView }: HeaderClientProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

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

  const logoHref = user ? "/museboard" : "/";
  const userInitial = profile?.full_name?.charAt(0).toUpperCase() || "A";

  return (
    <>
      <header className="sticky top-0 w-full bg-background/80 backdrop-blur-sm z-50">
        <div className="relative flex items-center justify-between px-6 lg:px-8 py-4 border-b border-border/50">
          <div className="flex items-center flex-1">
            <Link href={logoHref} onClick={closeMobileMenu} className="-m-1.5 p-1.5 flex items-center gap-2 group">
              <span className="sr-only">MBLM</span>
              <IridescentIcon icon={Crop} className="icon-iridescent h-6 w-6 transition-transform duration-200 group-hover:rotate-12" />
              <span className="font-bold text-2xl text-foreground">MBLM</span>
            </Link>
          </div>

          <nav className="hidden md:flex items-center gap-6">
            {!user ? (
              loggedOutLinks.map((link) =>
                link.isButton ? (
                  <Button key={link.href} variant="white" asChild>
                    <Link href={link.href}>{link.label}</Link>
                  </Button>
                ) : (
                  <NavLink key={link.href} href={link.href}>
                    {link.label}
                  </NavLink>
                )
              )
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-10 w-10 rounded-full cursor-pointer hover:scale-110 transition-transform focus-visible:ring-0 focus-visible:ring-offset-0"
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={profile?.avatar_url || ""} alt={profile?.full_name || ""} />
                      <AvatarFallback>{userInitial}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{profile?.full_name}</p>
                      <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="cursor-pointer hover:scale-103" onSelect={() => setIsSettingsOpen(true)}>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <form action={logOut} className="w-full">
                    <button type="submit" className="w-full text-left">
                      <DropdownMenuItem className="cursor-pointer hover:scale-103">
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Log out</span>
                      </DropdownMenuItem>
                    </button>
                  </form>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </nav>
          
          <div className="flex md:hidden">
            <button type="button" onClick={toggleMobileMenu} className="-m-2.5 p-2.5">
              <span className="sr-only">Open main menu</span>
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
        
        <div id="mobile-menu" data-open={mobileMenuOpen} className="absolute top-full left-0 w-full z-40 md:hidden border-b border-border/50 bg-background/95 backdrop-blur-lg p-6 flex flex-col gap-6 transition-all duration-300 ease-in-out opacity-0 -translate-y-4 pointer-events-none data-[open=true]:opacity-100 data-[open=true]:translate-y-0 data-[open=true]:pointer-events-auto">
          {!user ? (
            <>
              <nav className="flex flex-col items-start gap-4">
                {loggedOutLinks.filter(l => !l.isButton).map((link) => (
                  <NavLink key={link.href} href={link.href} onClick={closeMobileMenu} className="text-lg w-fit">
                    {link.label}
                  </NavLink>
                ))}
              </nav>
              <Button variant="white" asChild className="w-full">
                <Link href="/sign-in" onClick={closeMobileMenu}>Try MBLM</Link>
              </Button>
            </>
          ) : (
            <>
              <div className="pt-4 border-t border-border/50">
                <div className="flex items-center px-1 mb-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={profile?.avatar_url || ""} alt={profile?.full_name || ""} />
                      <AvatarFallback>{userInitial}</AvatarFallback>
                    </Avatar>
                    <div className="ml-3">
                      <div className="text-base font-medium leading-none">{profile?.full_name}</div>
                      <div className="text-sm font-medium leading-none text-muted-foreground">{user.email}</div>
                    </div>
                </div>
                {/* --- THIS IS THE FIX: The mobile menu now uses a structure consistent with the desktop menu --- */}
                <div className="mt-3 space-y-1">
                  <div
                    role="button"
                    tabIndex={0}
                    className="flex items-center w-full px-3 py-2 rounded-md text-base font-medium cursor-pointer" 
                    onClick={() => {
                      setIsSettingsOpen(true);
                      closeMobileMenu();
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        setIsSettingsOpen(true);
                        closeMobileMenu();
                      }
                    }}
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </div>
                  
                  <form action={logOut}>
                    <button type="submit" className="w-full text-left" onClick={closeMobileMenu}>
                       <div 
                        role="menuitem"
                        className="flex items-center w-full px-3 py-2 rounded-md text-base font-medium cursor-pointer"
                       >
                         <LogOut className="mr-2 h-4 w-4" />
                         <span>Log out</span>
                       </div>
                    </button>
                  </form>
                </div>
              </div>
            </>
          )}
        </div>
      </header>
      
      {user && (
        <SettingsDialog 
          user={user} 
          profile={profile} 
          trashViewContent={trashView}
          open={isSettingsOpen}
          onOpenChange={setIsSettingsOpen}
        />
      )}
    </>
  );
}