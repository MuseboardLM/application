// components/museboard/EnlargedItemView.tsx

"use client";

import { useEffect, useMemo } from "react";
import Image from "next/image";
import { XIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { MuseItem } from "@/app/(private)/museboard/page";
import { cn } from "@/lib/utils";

interface EnlargedItemViewProps {
  items: MuseItem[];
  currentIndex: number;
  onClose: () => void;
  onNavigate: (newIndex: number) => void;
}

const LightboxButton = ({
  onClick,
  children,
  className = "",
  disabled = false,
}: {
  onClick: (e: React.MouseEvent) => void;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={cn(
      "absolute z-[110] p-2 bg-black/40 text-zinc-300 rounded-full hover:bg-black/60 hover:text-white transition-all duration-200 ease-in-out cursor-pointer backdrop-blur-sm",
      "disabled:opacity-20 disabled:cursor-not-allowed disabled:hover:bg-black/40",
      className
    )}
  >
    {children}
  </button>
);

const variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
    scale: 0.9,
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1,
    scale: 1,
  },
  exit: (direction: number) => ({
    zIndex: 0,
    x: direction < 0 ? 300 : -300,
    opacity: 0,
    scale: 0.9,
  }),
};

export default function EnlargedItemView({
  items,
  currentIndex,
  onClose,
  onNavigate,
}: EnlargedItemViewProps) {
  const currentItem = items[currentIndex];
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < items.length - 1;

  useEffect(() => {
    // Preloading logic remains the same...
    if (hasNext) {
      const nextItem = items[currentIndex + 1];
      if (nextItem.content_type.startsWith("image") && nextItem.signedUrl) {
        const img = new window.Image();
        img.src = nextItem.signedUrl;
      }
    }
    if (hasPrev) {
      const prevItem = items[currentIndex - 1];
      if (prevItem.content_type.startsWith("image") && prevItem.signedUrl) {
        const img = new window.Image();
        img.src = prevItem.signedUrl;
      }
    }
  }, [currentIndex, items, hasNext, hasPrev]);

  const handleNext = useMemo(() => () => {
    if (hasNext) onNavigate(currentIndex + 1);
  }, [hasNext, currentIndex, onNavigate]);

  const handlePrev = useMemo(() => () => {
    if (hasPrev) onNavigate(currentIndex - 1);
  }, [hasPrev, currentIndex, onNavigate]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") handleNext();
      if (e.key === "ArrowLeft") handlePrev();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, handleNext, handlePrev]);
  
  const direction = useMemo(() => {
    const prevIndex = sessionStorage.getItem('lightboxIndex');
    sessionStorage.setItem('lightboxIndex', String(currentIndex));
    if (prevIndex === null) return 1;
    return currentIndex > Number(prevIndex) ? 1 : -1;
  }, [currentIndex]);


  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md"
      onClick={onClose} // Added back the onClick handler to the outermost div
    >
      {/* Buttons remain unchanged */}
      <LightboxButton 
        onClick={(e) => {
          e.stopPropagation(); // Prevent closing when clicking the X button
          onClose();
        }} 
        className="top-4 right-4"
      >
        <XIcon size={24} />
      </LightboxButton>
      <LightboxButton
        onClick={(e) => { e.stopPropagation(); handlePrev(); }}
        className="left-4 top-1/2 -translate-y-1/2"
        disabled={!hasPrev}
      >
        <ChevronLeftIcon size={28} />
      </LightboxButton>
      <LightboxButton
        onClick={(e) => { e.stopPropagation(); handleNext(); }}
        className="right-4 top-1/2 -translate-y-1/2"
        disabled={!hasNext}
      >
        <ChevronRightIcon size={28} />
      </LightboxButton>

      {/* The Content Wrapper - removed onClick from here */}
      <div
        className="relative w-full h-full flex items-center justify-center p-8 sm:p-16 overflow-hidden"
        // Removed onClick={onClose} from here
      >
        <AnimatePresence initial={false} custom={direction}>
          <motion.div
            key={currentIndex}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 },
            }}
            className="absolute w-full h-full flex items-center justify-center pointer-events-none"
          >
            {currentItem.content_type.startsWith("image") && currentItem.signedUrl ? (
              <Image
                src={currentItem.signedUrl}
                alt={currentItem.description || "Enlarged Muse Item"}
                width={1920}
                height={1080}
                className="block max-w-full max-h-full object-contain rounded-lg shadow-2xl pointer-events-auto"
                priority={true}
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <div 
                className="max-w-3xl bg-zinc-900 p-8 rounded-lg pointer-events-auto"
                onClick={(e) => e.stopPropagation()}
              >
                 <p className="text-lg text-zinc-200 whitespace-pre-wrap leading-relaxed">
                  {currentItem.content}
                </p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
  
}
