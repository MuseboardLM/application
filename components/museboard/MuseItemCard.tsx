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
}

export default function MuseItemCard({
  item,
  index,
  isSelectionMode,
  isSelected,
  onToggleSelect,
  onStartSelection,
  onDelete,
}: MuseItemCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

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

  const handleCardClick = () => {
    if (isSelectionMode) {
      onToggleSelect();
    }
  };

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
        cursor: isSelectionMode ? "pointer" : "default",
      }}
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.05 }}
      className="group relative mb-4 p-1 bg-transparent border-none will-change-transform [break-inside:avoid] user-select-none"
    >
      <motion.div
        className="h-full w-full rounded-lg bg-zinc-900 overflow-hidden flex flex-col transition-shadow duration-300 ease-in-out shadow-[0_40px_80px_-20px_rgba(0,0,0,0.5)] md:group-hover:shadow-[0_0_25px_var(--glow)]"
        style={{ transform: "translateZ(20px)" }}
        animate={{ animation: `float 6s ease-in-out infinite`, animationDelay: `${index * 0.2}s` }}
        whileHover={{ scale: isSelectionMode ? 1 : 1.03 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
      >
        <AnimatePresence>
          {isSelectionMode && (
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

        {/* --- THIS IS THE FIX --- */}
        {/* We changed `group-hover:opacity-100` to `md:group-hover:opacity-100` */}
        <div className="absolute top-2 right-2 z-20 opacity-0 md:group-hover:opacity-100 transition-opacity duration-200">
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
              <DropdownMenuContent align="end" className="w-40" onClick={(e) => e.stopPropagation()}>
                <DropdownMenuItem onClick={onStartSelection}>
                  <CheckSquare className="mr-2 size-4" />
                  <span>Select</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-red-500 focus:text-white focus:bg-red-500"
                  onClick={onDelete}
                >
                  <Trash2 className="mr-2 size-4" />
                  <span>Delete</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {isImageType && item.signedUrl && (
          <div className="relative aspect-auto w-full overflow-hidden">
            {isSelectionMode && <div className={cn("absolute inset-0 bg-black/30 z-10 transition-opacity", !isSelected && "bg-black/60")} />}
            <Image
              src={item.signedUrl}
              alt={item.description || "Muse Image"}
              width={500}
              height={500}
              sizes="(max-width: 768px) 100vw, 500px"
              className="object-cover w-full h-auto bg-zinc-800"
            />
          </div>
        )}

        {!isImageType && (
          <div className="p-5 flex-grow relative">
            {isSelectionMode && <div className={cn("absolute inset-0 bg-black/30 z-10 transition-opacity", !isSelected && "bg-black/60")} />}
            <p className="text-base text-zinc-300 whitespace-pre-wrap leading-relaxed">{item.content}</p>
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
              className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
              title={item.source_url}
            >
              <Link2Icon className="size-3" />
              <span>Source</span>
            </a>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
}