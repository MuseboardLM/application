// components/museboard/MuseboardFAB.tsx
"use client";

import { useState, useEffect, useRef } from "react"; // 1. Import useEffect and useRef
import { Button } from "@/components/ui/button";
import { PlusIcon, XIcon, UploadCloudIcon, LinkIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface MuseboardFABProps {
  onUploadClick: () => void;
  onPasteLinkClick: () => void;
}

export default function MuseboardFAB({ onUploadClick, onPasteLinkClick }: MuseboardFABProps) {
  const [isOpen, setIsOpen] = useState(false);
  const fabRef = useRef<HTMLDivElement>(null); // 2. Create a ref for the component's container

  // 3. Add an effect to handle clicks outside the component
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (fabRef.current && !fabRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    // Add the event listener when the menu is open
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    // Cleanup: remove the event listener when the component unmounts or the menu closes
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]); // The effect depends on the `isOpen` state

  const SubActionButton = ({
    label,
    onClick,
    children,
    className,
  }: {
    label: string;
    onClick: () => void;
    children: React.ReactNode;
    className?: string;
  }) => (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full cursor-pointer items-center justify-end gap-3 group hover:scale-110",
        className
      )}
    >
      <span className="rounded-md bg-background px-3 py-1.5 text-sm shadow-md transition-colors group-hover:text-primary">
        {label}
      </span>
      <div className="flex size-10 items-center justify-center rounded-full bg-secondary shadow-lg transition-colors group-hover:bg-secondary/80">
        {children}
      </div>
    </button>
  );

  return (
    // 4. Attach the ref to the main container div
    <div ref={fabRef} className="fixed bottom-8 right-8 z-40">
      <div className="relative flex flex-col items-center gap-3">
        {/* Sub-button for Pasting a Link */}
        <SubActionButton
          label="Paste Link"
          onClick={() => {
            onPasteLinkClick();
            setIsOpen(false);
          }}
          className={cn(
            "transition-all duration-300 ease-in-out",
            isOpen ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0 pointer-events-none"
          )}
        >
          <LinkIcon className="size-5" />
        </SubActionButton>

        {/* Sub-button for Uploading a File */}
        <SubActionButton
          label="Upload File"
          onClick={() => {
            onUploadClick();
            setIsOpen(false);
          }}
          className={cn(
            "transition-all duration-300 ease-in-out",
            isOpen ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0 pointer-events-none"
          )}
        >
          <UploadCloudIcon className="size-5" />
        </SubActionButton>

       
        <Button
          size="lg"
          className="h-14 w-14 rounded-full shadow-2xl transition-all duration-300 ease-in-out hover:scale-110 hover:shadow-primary/30 cursor-pointer"
          onClick={() => setIsOpen(!isOpen)}
        >
          <PlusIcon
            className={cn(
              "absolute transition-all duration-300 ease-in-out",
              isOpen ? "rotate-45 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100"
            )}
          />
          <XIcon
            className={cn(
              "absolute transition-all duration-300 ease-in-out",
              isOpen ? "rotate-0 scale-100 opacity-100" : "-rotate-45 scale-0 opacity-0"
            )}
          />
        </Button>
      </div>
    </div>
  );
}