// components/museboard/MuseItemCard.tsx
"use client";

import Image from "next/image"; // Import the Next.js Image component
import { MuseItem } from "@/app/(private)/museboard/page";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Link2Icon, ImageIcon } from "lucide-react";
import ClientFormattedDate from './ClientFormattedDate';

interface MuseItemCardProps {
  item: MuseItem;
}

export default function MuseItemCard({ item }: MuseItemCardProps) {
  // Helper to render the main content of the card
  const renderContent = () => {
    const isImageType = item.content_type === 'image' || item.content_type === 'screenshot';

    // **NEW**: If it's an image type and we have a secure signedUrl, display the image.
    if (isImageType && item.signedUrl) {
      return (
        <div className="relative aspect-square w-full overflow-hidden rounded-md bg-muted">
          <Image
            src={item.signedUrl}
            alt={item.description || "Muse Image"}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 hover:scale-105"
          />
        </div>
      );
    }
    
    // Fallback for image types if URL is missing (e.g., loading or error)
    if (isImageType) {
        return (
            <div className="flex aspect-square w-full flex-col items-center justify-center rounded-md bg-muted text-muted-foreground">
                <ImageIcon className="size-8" />
                <p className="mt-2 text-xs">Image loading...</p>
            </div>
        );
    }

    // For video, links, articles, just display a clickable link.
    if (["video", "link", "article"].includes(item.content_type)) {
       return (
        <a href={item.content} target="_blank" rel="noopener noreferrer" className="block p-4 text-sm truncate text-blue-400 hover:underline">
          {item.content}
        </a>
      );
    }

    // Default for text, notes, tweets, etc.
    return <p className="p-4 text-sm text-foreground whitespace-pre-wrap">{item.content}</p>;
  };

  return (
    <Card className="flex flex-col h-full bg-card/50 hover:bg-card/90 transition-colors duration-200 overflow-hidden">
      {/* For image types, we render the content outside the normal padding flow */}
      {(item.content_type === 'image' || item.content_type === 'screenshot') ? renderContent() : (
        <>
            <CardHeader>
                <CardTitle className="text-base font-semibold capitalize">{item.content_type}</CardTitle>
                {item.description && <CardDescription className="text-xs">{item.description}</CardDescription>}
            </CardHeader>
            <CardContent className="flex-grow p-0">
                {renderContent()}
            </CardContent>
        </>
      )}

      {/* Footer remains the same but with conditional padding */}
      <CardFooter className="flex justify-between items-center text-xs text-muted-foreground p-4">
      <ClientFormattedDate date={item.created_at} />
        {item.source_url && (
           <a
            href={item.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 hover:text-foreground"
            title={item.source_url}
          >
            <Link2Icon className="size-3" />
            Source
          </a>
        )}
      </CardFooter>
    </Card>
  );
}