// components/museboard/MuseItemCard.tsx

"use client";

import { useRef, useCallback } from "react";
import Image from "next/image";
import { MuseItem } from "@/app/(private)/museboard/page";
import { Link2Icon, MoreVertical, Trash2, CheckSquare, Check } from "lucide-react";
import { motion, useMotionValue, useTransform, AnimatePresence } from "framer-motion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useLongPress } from "@/hooks/use-long-press";

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
  // ... (all the existing hooks and handlers remain the same)
  const cardRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const isDropdownInteraction = useRef(false);

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useTransform(y, [-150, 150], [10, -10]);
  const rotateY = useTransform(x, [-150, 150], [-10, 10]);

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current || isSelectionMode) return;
    const rect = cardRef.current.getBoundingClientRect();
    x.set(event.clientX - rect.left - rect.width / 2);
    y.set(event.clientY - rect.top - rect.height / 2);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
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

  return (
    <motion.div
      ref={cardRef}
      {...longPressEvents}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
        perspective: "1000px",
      }}
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.05 }}
      className={cn(
        "group relative mb-4 p-1 bg-transparent border-none will-change-transform [break-inside:avoid] user-select-none",
        !isSelectionMode && "cursor-pointer"
      )}
    >
      <motion.div
        className="h-full w-full rounded-lg bg-zinc-900 overflow-hidden flex flex-col transition-shadow duration-300 ease-in-out shadow-[0_40px_80px_-20px_rgba(0,0,0,0.5)] md:group-hover:shadow-[0_0_25px_var(--glow)]"
        style={{ transform: "translateZ(20px)" }}
        animate={{ animation: `float 6s ease-in-out infinite`, animationDelay: `${index * 0.2}s` }}
        whileHover={{ scale: isSelectionMode ? 1 : 1.03 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
      >
        {/* ... (selection and dropdown menu JSX is unchanged) ... */}

        {/* ⬇️ MODIFIED: This is the updated rendering logic for images */}
        {isImageType && item.signedUrl && (
          <div className="relative w-full">
            {isSelectionMode && <div className={cn("absolute inset-0 bg-black/30 z-10 transition-opacity", !isSelected && "bg-black/60")} />}
            <Image
              src={item.signedUrl}
              alt={item.description || "Muse Image"}
              // Use the item's true dimensions, with a fallback for old items
              width={item.image_width || 500}
              height={item.image_height || 500}
              // This className makes the image responsive while maintaining its aspect ratio
              className="object-contain w-full h-auto bg-zinc-800"
              unoptimized
            />
          </div>
        )}

        {!isImageType && (
          <div className="p-5 flex-grow relative">
            {isSelectionMode && <div className={cn("absolute inset-0 bg-black/30 z-10 transition-opacity", !isSelected && "bg-black/60")} />}
            <p className="text-base text-zinc-300 whitespace-pre-wrap leading-relaxed">{item.content}</p>
          </div>
        )}
        
        {/* ... (source url JSX is unchanged) ... */}
        
      </motion.div>
    </motion.div>
  );
}