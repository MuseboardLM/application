// components/museboard/TrashItemCard.tsx

"use client";

import { useRef } from "react";
import Image from "next/image";
import { MuseItem } from "@/app/(private)/museboard/page";
import { MoreVertical, RotateCw, Trash2, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import ClientFormattedDate from "./ClientFormattedDate";

interface TrashItemCardProps {
  item: MuseItem;
  isSelected: boolean;
  onToggleSelect: () => void;
  onRestore: () => void;
  onPermanentDelete: () => void;
}

export default function TrashItemCard({ item, isSelected, onToggleSelect, onRestore, onPermanentDelete }: TrashItemCardProps) {
  const isImageType = item.content_type === "image" || item.content_type === "screenshot";

  return (
    <motion.div
      onClick={onToggleSelect}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="group relative mb-4 p-1 bg-transparent border-none will-change-transform [break-inside:avoid] cursor-pointer"
    >
      <div className="h-full w-full rounded-lg bg-zinc-900 overflow-hidden flex flex-col transition-all duration-300 ease-in-out">
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.2 }}
            className="absolute top-3 left-3 z-20"
          >
            <div
              className={cn(
                "flex items-center justify-center h-6 w-6 rounded-md border-2 bg-black/50 backdrop-blur-sm transition-all duration-200",
                isSelected ? "bg-zinc-100 border-zinc-300" : "border-zinc-400 group-hover:border-white"
              )}
            >
              {isSelected && <Check className="h-4 w-4 text-zinc-900" />}
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="absolute top-2 right-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="p-1.5 rounded-full bg-black/40 text-zinc-300 hover:bg-black/60 hover:text-white transition-all cursor-pointer"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical size={18} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48" onClick={(e) => e.stopPropagation()}>
              <DropdownMenuItem onClick={onRestore}>
                <RotateCw className="mr-2 size-4" />
                <span>Restore</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="text-red-500 focus:text-white focus:bg-red-500" onClick={onPermanentDelete}>
                <Trash2 className="mr-2 size-4" />
                <span>Delete Permanently</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="relative aspect-auto w-full overflow-hidden">
          <div className="absolute inset-0 bg-black/60 z-10" />
          {isImageType && item.signedUrl ? (
            <Image src={item.signedUrl} alt={item.description || "Muse Image"} width={500} height={500} className="object-cover w-full h-auto bg-zinc-800" />
          ) : (
            <div className="p-5">
              <p className="text-base text-zinc-400 whitespace-pre-wrap leading-relaxed truncate-5-lines">{item.content}</p>
            </div>
          )}
        </div>
        
        <div className="p-3 text-xs text-muted-foreground border-t border-border/50">
            Deleted <ClientFormattedDate date={item.deleted_at!} />
        </div>
      </div>
    </motion.div>
  );
}