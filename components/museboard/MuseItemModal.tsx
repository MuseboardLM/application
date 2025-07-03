"use client";

import Image from "next/image";
import { MuseItem } from "@/app/(private)/museboard/page";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { Link2Icon, CalendarIcon, TagsIcon, BrainCircuit, ChevronLeftIcon, ChevronRightIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import ClientFormattedDate from "./ClientFormattedDate";

interface MuseItemModalProps {
  item: MuseItem | null;
  isOpen: boolean;
  onClose: () => void;
  onNavigateNext: () => void;
  onNavigatePrev: () => void;
  hasNext: boolean;
  hasPrev: boolean;
}

export default function MuseItemModal({
  item,
  isOpen,
  onClose,
  onNavigateNext,
  onNavigatePrev,
  hasNext,
  hasPrev,
}: MuseItemModalProps) {
  if (!item) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        variant="fullscreen"
        className="flex flex-col md:flex-row gap-0"
        showCloseButton={false}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Muse Item Details</DialogTitle>
          <DialogDescription>
            {item.description || item.content?.substring(0, 100) || 'Viewing a saved muse item.'}
          </DialogDescription>
        </DialogHeader>

        {/* Navigation Buttons */}
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "absolute left-4 top-1/2 -translate-y-1/2 z-20 rounded-full bg-black/40 text-zinc-300 hover:bg-black/60 hover:text-white cursor-pointer hover:scale-103",
            !hasPrev && "opacity-20 pointer-events-none"
          )}
          onClick={onNavigatePrev}
          disabled={!hasPrev}
        >
          <ChevronLeftIcon className="size-6" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "absolute right-4 top-1/2 -translate-y-1/2 z-20 rounded-full bg-black/40 text-zinc-300 hover:bg-black/60 hover:text-white cursor-pointer hover:scale-103",
            !hasNext && "opacity-20 pointer-events-none"
          )}
          onClick={onNavigateNext}
          disabled={!hasNext}
        >
          <ChevronRightIcon className="size-6" />
        </Button>
        
        {/* Close Button (Top Right) */}
        <Button asChild variant="ghost" size="icon" className="absolute top-4 right-4 z-20 rounded-full bg-black/40 text-zinc-300 hover:bg-black/60 hover:text-white cursor-pointer hover:scale-103">
            <DialogClose>
                <XIcon className="size-5"/>
                <span className="sr-only">Close</span>
            </DialogClose>
        </Button>

        {/* Left Side: Content Display */}
        <div className="md:w-3/5 h-1/2 md:h-full bg-black flex items-center justify-center overflow-hidden">
          {item.content_type.startsWith("image") && item.signedUrl ? (
            <Image
              src={item.signedUrl}
              alt={item.description || "Enlarged Muse Item"}
              width={1920}
              height={1080}
              unoptimized // 👈 This is the key change. It bypasses all Next.js image optimization.
              sizes="(min-width: 768px) 60vw, 100vw"
              className="block w-full h-full object-contain"
              priority
            />
          ) : (
            <div className="p-8 overflow-y-auto w-full h-full">
              <p className="text-lg text-zinc-200 whitespace-pre-wrap leading-relaxed">
                {item.content}
              </p>
            </div>
          )}
        </div>

        {/* Right Side: Information & AI Panel */}
        <div className="md:w-2/5 h-1/2 md:h-full bg-zinc-900 flex flex-col p-6 overflow-y-auto">
          <h3 className="font-bold text-xl text-zinc-100 mb-4 border-b border-zinc-700 pb-3">Details</h3>
          
          <div className="space-y-5 text-sm">
            {item.description && (
              <div>
                <p className="text-zinc-400 mb-1">Description</p>
                <p className="text-zinc-200">{item.description}</p>
              </div>
            )}

            {item.source_url && (
              <div>
                <p className="text-zinc-400 mb-1">Source</p>
                <a
                  href={item.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors break-all"
                >
                  <Link2Icon className="size-4 flex-shrink-0" />
                  <span className="truncate">{item.source_url}</span>
                </a>
              </div>
            )}
            
            <div>
              <p className="text-zinc-400 mb-1">Created</p>
              <div className="flex items-center gap-2 text-zinc-300">
                <CalendarIcon className="size-4" />
                <ClientFormattedDate dateString={item.created_at} />
              </div>
            </div>
          </div>

          <h3 className="font-bold text-xl text-zinc-100 mt-8 mb-4 border-b border-zinc-700 pb-3">Shadow Insights</h3>

          <div className="space-y-5 text-sm">
              <div>
                <p className="flex items-center gap-2 text-zinc-400 mb-2"><TagsIcon className="size-4" /> AI Categories</p>
                <div className="flex flex-wrap gap-2">
                  {item.ai_categories?.map(tag => <div key={tag} className="bg-zinc-700 text-zinc-200 px-2 py-1 rounded-md text-xs">{tag}</div>) 
                    ?? <p className="text-zinc-500 italic">No categories identified yet.</p>
                  }
                </div>
              </div>

              <div>
                <p className="flex items-center gap-2 text-zinc-400 mb-2"><BrainCircuit className="size-4" /> Connections</p>
                <p className="text-zinc-500 italic">Shadow is thinking... Check back later for connections to your goals.</p>
              </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}