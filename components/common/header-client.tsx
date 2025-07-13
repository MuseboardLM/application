// components/common/header-client.tsx

"use client";

import { useState, useEffect, ReactNode, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Crop, Menu, X, LogOut, Settings, Plus, Search, ArrowDownUp, Sparkles, Clock, Upload, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import NavLink from "./nav-link";
import IridescentIcon from "@/components/ui/iridescent-icon";
import type { User } from "@supabase/supabase-js";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import SettingsDialog from "./SettingsDialog";
import { AnimatePresence, motion } from "framer-motion";
import type { MuseItemSort } from "@/lib/types";
import eventBus from "@/lib/utils/event-bus";
import AddLinkDialog from "../museboard/AddLinkDialog"; // <-- Import the new dialog

// This component contains the logic for the Museboard controls
const MuseboardControls = ({ onAddLinkClick }: { onAddLinkClick: () => void }) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleSortChange = (sort: MuseItemSort) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('sort', sort.field);
    params.set('dir', sort.direction);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };
  
  const handleAddFromDeviceClick = () => {
    eventBus.emit('open-add-file-dialog');
  }

  const sortOptions: { label: string; value: MuseItemSort }[] = [
    { label: 'Most Relevant', value: { field: 'ai_relevance_score', direction: 'desc' } },
    { label: 'Newest First', value: { field: 'created_at', direction: 'desc' } },
    { label: 'Oldest First', value: { field: 'created_at', direction: 'asc' } },
    { label: 'Recently Updated', value: { field: 'updated_at', direction: 'desc' } },
  ];

  return (
    <div className="flex items-center gap-1">
      {/* --- THIS IS NOW A DROPDOWN MENU --- */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="icon" variant="ghost" className="text-zinc-300 hover:text-white transition-transform cursor-pointer hover:scale-110">
            <Plus className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Add to Museboard</DropdownMenuLabel>
          <DropdownMenuSeparator/>
          <DropdownMenuItem onSelect={handleAddFromDeviceClick} className="cursor-pointer">
            <Upload className="mr-2 h-4 w-4" />
            <span>Upload from device</span>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={onAddLinkClick} className="cursor-pointer">
            <Link2 className="mr-2 h-4 w-4" />
            <span>Add from link</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="text-zinc-300 hover:text-white transition-transform cursor-pointer hover:scale-110">
            <ArrowDownUp className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuLabel>Sort by</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {sortOptions.map(option => (
            <DropdownMenuItem key={option.label} onSelect={() => handleSortChange(option.value)} className="cursor-pointer">
              {option.value.field === 'ai_relevance_score' && <Sparkles className="mr-2 h-4 w-4 text-purple-400" />}
              {option.value.field.includes('created') && <Clock className="mr-2 h-4 w-4 text-blue-400" />}
              {option.value.field.includes('updated') && <Clock className="mr-2 h-4 w-4 text-green-400" />}
              <span>{option.label}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

// ... (keep NavLinkType, Profile, and HeaderClientProps interfaces as they are)
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
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [isAddLinkOpen, setIsAddLinkOpen] = useState(false); // <-- State for the new dialog
  
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchInputRef = useRef<HTMLInputElement>(null);

  const isMuseboardPage = pathname === '/museboard';
  
  const handleSearchToggle = () => {
    setIsSearchVisible(prev => !prev);
  };

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const query = searchInputRef.current?.value || '';
    const params = new URLSearchParams(searchParams.toString());
    if (query) {
      params.set('q', query);
    } else {
      params.delete('q');
    }
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };
  
  useEffect(() => {
    if (isSearchVisible) {
      searchInputRef.current?.focus();
    }
  }, [isSearchVisible]);


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
      <header className="sticky top-0 w-full bg-background/80 backdrop-blur-sm z-50 border-b border-border/50">
        <div className="relative flex items-center justify-between px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center gap-4">
            <Link href={logoHref} onClick={closeMobileMenu} className="-m-1.5 p-1.5 flex items-center gap-2 group">
              <span className="sr-only">MBLM</span>
              <IridescentIcon icon={Crop} className="icon-iridescent h-6 w-6 transition-transform duration-200 group-hover:rotate-12" />
              <span className="font-bold text-2xl text-foreground">MBLM</span>
            </Link>
          </div>

          <nav className="flex items-center gap-2">
            {!user ? (
              <div className="hidden sm:flex items-center gap-6">
                {loggedOutLinks.map((link) =>
                  link.isButton ? (
                    <Button key={link.href} variant="white" asChild>
                      <Link href={link.href}>{link.label}</Link>
                    </Button>
                  ) : (
                    <NavLink key={link.href} href={link.href}>{link.label}</NavLink>
                  )
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                {isMuseboardPage && 
                  <>
                    <MuseboardControls onAddLinkClick={() => setIsAddLinkOpen(true)} />
                    <Button onClick={handleSearchToggle} size="icon" variant="ghost" className="text-zinc-300 hover:text-white transition-transform cursor-pointer hover:scale-110">
                      <Search className="h-5 w-5" />
                    </Button>
                  </>
                }
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                     <Button variant="ghost" className="relative h-9 w-9 rounded-full transition-transform cursor-pointer hover:scale-110 focus-visible:ring-0 focus-visible:ring-offset-0">
                       <Avatar className="h-9 w-9">
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
                     <DropdownMenuItem className="cursor-pointer" onSelect={() => setIsSettingsOpen(true)}>
                       <Settings className="mr-2 h-4 w-4" />
                       <span>Settings</span>
                     </DropdownMenuItem>
                     <DropdownMenuSeparator />
                     <form action={logOut} className="w-full">
                       <button type="submit" className="w-full text-left">
                         <DropdownMenuItem className="cursor-pointer">
                           <LogOut className="mr-2 h-4 w-4" />
                           <span>Log out</span>
                         </DropdownMenuItem>
                       </button>
                     </form>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
            <div className="flex md:hidden">
              <button type="button" onClick={toggleMobileMenu} className="-m-2.5 p-2.5">
                <span className="sr-only">Open main menu</span>
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </nav>
        </div>
        
        <AnimatePresence>
          {isSearchVisible && isMuseboardPage && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="w-full overflow-hidden"
            >
              <div className="bg-black/50 border-t border-border/50 p-4">
                <form onSubmit={handleSearchSubmit} className="max-w-xl mx-auto">
                  <Input 
                    ref={searchInputRef}
                    placeholder="Search your muse by keyword, theme, or inspiration..." 
                    defaultValue={searchParams.get('q') || ''}
                    className="bg-zinc-900 border-zinc-700 h-10"
                  />
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
      
      {/* ... (Your existing mobile menu div) ... */}
      <div id="mobile-menu" data-open={mobileMenuOpen} className="absolute top-full left-0 w-full z-40 md:hidden border-b border-border/50 bg-background/95 backdrop-blur-lg p-6 flex flex-col gap-6 transition-all duration-300 ease-in-out opacity-0 -translate-y-4 pointer-events-none data-[open=true]:opacity-100 data-[open=true]:translate-y-0 data-[open=true]:pointer-events-auto">
          {/* ... mobile menu content ... */}
      </div>

      {/* Render the new dialog */}
      <AddLinkDialog open={isAddLinkOpen} onOpenChange={setIsAddLinkOpen} />
      
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