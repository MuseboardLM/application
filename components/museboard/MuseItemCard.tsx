"use client";

import { useRef } from 'react';
import Image from "next/image";
import { MuseItem } from "@/app/(private)/museboard/page";
import { Link2Icon } from "lucide-react";
import { motion, useMotionValue, useTransform } from "framer-motion";

interface MuseItemCardProps {
  item: MuseItem;
  index: number; // For staggered animation
}

export default function MuseItemCard({ item, index }: MuseItemCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rotateX = useTransform(y, [-150, 150], [10, -10]);
  const rotateY = useTransform(x, [-150, 150], [-10, 10]);

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    x.set(event.clientX - rect.left - rect.width / 2);
    y.set(event.clientY - rect.top - rect.height / 2);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  const isImageType = item.content_type === 'image' || item.content_type === 'screenshot';

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: 'preserve-3d',
        perspective: '1000px',
      }}
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.05 }}
      // --- CHANGE #1 ---
      // We removed the `card-glow-on-hover` class and kept `group` which is what we need.
      className="group relative mb-4 p-1 bg-transparent border-none will-change-transform [break-inside:avoid]"
    >
      <motion.div
        // --- CHANGE #2 ---
        // The shadow logic is now fully controlled by Tailwind classes.
        // We define the default deep shadow and then use `group-hover` to apply the white glow.
        // A smooth `transition-shadow` is also added.
        className="h-full w-full rounded-lg bg-zinc-900 overflow-hidden flex flex-col transition-shadow duration-300 ease-in-out shadow-[0_40px_80px_-20px_rgba(0,0,0,0.5)] group-hover:shadow-[0_0_25px_var(--glow)]"
        style={{
          // The inline `boxShadow` is removed from here.
          transform: 'translateZ(20px)',
        }}
        animate={{
          animation: `float 6s ease-in-out infinite`,
          animationDelay: `${index * 0.2}s`,
        }}
        whileHover={{ scale: 1.03 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
      >
        {isImageType && item.signedUrl && (
          <div className="relative aspect-auto w-full overflow-hidden">
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
          <div className="p-5 flex-grow">
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