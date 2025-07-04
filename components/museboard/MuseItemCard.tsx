"use client";

import { useRef, useCallback, useState } from "react";
import Image from "next/image";
import { MuseItem } from "@/app/(private)/museboard/page";
import { Link2Icon, MoreVertical, Trash2, CheckSquare, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useLongPress } from "@/lib/hooks/use-long-press";

interface MuseItemCardProps {
  item: MuseItem;
  index: number;
  isSelectionMode: boolean;
  isSelected: boolean;
  onToggleSelect: () => void;
  onStartSelection: () => void;
  onDelete: () => void;
  onEnlarge: () => void;
}

export default function MuseItemCard({
  item,
  index,
  isSelectionMode,
  isSelected,
  onToggleSelect,
  onStartSelection,
  onDelete,
  onEnlarge,
}: MuseItemCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const isDropdownInteraction = useRef(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseEnter = () => {
    if (!isSelectionMode) {
      setIsHovered(true);
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  const handleCardClick = useCallback((event: React.MouseEvent | React.TouchEvent) => {
    if (isDropdownInteraction.current) {
      isDropdownInteraction.current = false;
      return;
    }
    if (isSelectionMode) {
      onToggleSelect();
    } else {
      onEnlarge();
    }
  }, [isSelectionMode, onToggleSelect, onEnlarge]);

  const handleLongPress = useCallback(() => {
    if (!isSelectionMode) {
      onStartSelection();
    }
  }, [isSelectionMode, onStartSelection]);

  const longPressEvents = useLongPress(handleLongPress, handleCardClick);

  const isImageType = item.content_type === "image" || item.content_type === "screenshot";
  const isTextType = item.content_type === "text";

  return (
    <motion.div
      ref={cardRef}
      {...longPressEvents}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        zIndex: isHovered ? 50 : 1,
        position: "relative",
      }}
      initial={{ opacity: 0, y: 50 }}
      animate={{
        opacity: 1,
        y: isHovered ? 0 : [-2, 2],
        // ✨ SUGGESTION 1: Increased magnification scale for text cards from 1.7 to 2.0
        scale: isHovered && !isSelectionMode ? (isTextType ? 2.0 : 1.15) : 1,
      }}
      transition={{
        y: {
          duration: 4,
          repeat: Infinity,
          repeatType: "mirror",
          ease: "easeInOut",
          delay: index * 0.2,
        },
        scale: { type: "spring", stiffness: 200, damping: 20 },
        opacity: { duration: 0.5, delay: index * 0.05 },
      }}
      className={cn(
        "group relative mb-4 p-1 bg-transparent border-none will-change-transform [break-inside:avoid] user-select-none",
        !isSelectionMode && "cursor-pointer",
        isHovered && !isSelectionMode && "muse-card-magnified"
      )}
    >
      <AnimatePresence>
        {isHovered && !isSelectionMode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 pointer-events-none"
            style={{ zIndex: 40 }}
          />
        )}
      </AnimatePresence>

      <div
        className={cn(
          "h-full w-full rounded-lg bg-zinc-900 overflow-hidden flex flex-col transition-shadow duration-400 ease-out",
          "shadow-[0_40px_80px_-20px_rgba(0,0,0,0.5)]",
          isHovered && !isSelectionMode && "shadow-[0_0_60px_var(--glow),0_0_120px_var(--glow)] ring-2 ring-white/20"
        )}
        style={{
          position: "relative",
          zIndex: isHovered ? 50 : 1
        }}
      >
        <AnimatePresence>
          {isSelectionMode && (
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                transition={{ duration: 0.2 }}
                className="absolute top-3 left-3 z-20"
                style={{ cursor: "pointer" }}
              >
                <div
                  className={cn(
                    "flex items-center justify-center h-6 w-6 rounded-md border-2 bg-black/50 backdrop-blur-sm transition-all duration-200",
                    isSelected
                      ? "bg-zinc-100 border-zinc-300"
                      : "border-zinc-400 group-hover:border-white"
                  )}
                >
                  {isSelected && <Check className="h-4 w-4 text-zinc-900" />}
                </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        <div
          ref={dropdownRef}
          className={cn(
            "absolute top-2 right-2 z-20 transition-opacity duration-200",
            isHovered && !isSelectionMode ? "opacity-100" : "opacity-0 md:group-hover:opacity-100"
          )}
          onMouseDown={() => { isDropdownInteraction.current = true; }}
          onTouchStart={() => { isDropdownInteraction.current = true; }}
        >
          {!isSelectionMode && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="p-1.5 rounded-full bg-black/40 text-zinc-300 hover:bg-black/60 hover:text-white transition-all cursor-pointer"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical size={18} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-40"
                onCloseAutoFocus={(e) => e.preventDefault()}
              >
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    onStartSelection();
                  }}
                >
                  <CheckSquare className="mr-2 size-4" />
                  <span>Select</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-red-500 focus:text-white focus:bg-red-500 cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                  }}
                >
                  <Trash2 className="mr-2 size-4" />
                  <span>Delete</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {isImageType && item.signedUrl && (
          <div className="relative w-full">
            {isSelectionMode && <div className={cn("absolute inset-0 bg-black/30 z-10 transition-opacity", !isSelected && "bg-black/60")} />}
            <Image
              src={item.signedUrl}
              alt={item.description || "Muse Image"}
              width={item.image_width || 500}
              height={item.image_height || 500}
              className="object-contain w-full h-auto bg-zinc-800"
              unoptimized
            />
          </div>
        )}

        {!isImageType && (
          // Container div is back to a simple relative block
          <div className="p-5 flex-grow relative">
            {isSelectionMode && <div className={cn("absolute inset-0 bg-black/30 z-10 transition-opacity", !isSelected && "bg-black/60")} />}
            <p className={cn(
              "transition-all duration-300 ease-out",
              "whitespace-pre-wrap",
              // The max-width constraint has been removed
              isHovered && !isSelectionMode 
                // ✨ SUGGESTION 2: Calibrated font size to work with the new 2.0x scale
                ? "text-white text-lg leading-relaxed font-normal" 
                : "text-base text-zinc-300 leading-relaxed"
            )}>
              {item.content}
            </p>
          </div>
        )}

        {item.source_url && (
          <motion.div
            className="absolute bottom-0 left-0 right-0 p-4 bg-black/30 backdrop-blur-sm"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <a
              href={item.source_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
              title={item.source_url}
            >
              <Link2Icon className="size-3" />
              <span>Source</span>
            </a>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}