// components/museboard/MuseboardClientWrapper.tsx

"use client";

import { useState, useCallback } from "react";
import { User } from "@supabase/supabase-js";
import { MuseItem } from "@/app/(private)/museboard/page";
import MuseItemCard from "./MuseItemCard";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { v4 as uuidv4 } from "uuid";
import { UploadCloudIcon } from "lucide-react";
import MuseboardFAB from "./MuseboardFAB";
import PasteLinkModal from "./PasteLinkModal";

interface MuseboardClientWrapperProps {
  initialMuseItems: MuseItem[];
  user: User;
}

export default function MuseboardClientWrapper({
  initialMuseItems,
  user,
}: MuseboardClientWrapperProps) {
  const [museItems, setMuseItems] = useState<MuseItem[]>(initialMuseItems);
  const [isPasteLinkModalOpen, setIsPasteLinkModalOpen] = useState(false);
  const supabase = createClient();

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (!acceptedFiles.length) return;
      const file = acceptedFiles[0];
      const fileExtension = file.name.split('.').pop();
      const filePath = `${user.id}/${uuidv4()}.${fileExtension}`;
      const toastId = toast.loading("Uploading image...", { description: file.name });

      try {
        const { error: uploadError } = await supabase.storage.from('muse-files').upload(filePath, file);
        if (uploadError) throw uploadError;

        const { data: newItem, error: insertError } = await supabase.from('muse_items').insert({ user_id: user.id, content: filePath, content_type: 'image', description: file.name }).select().single();
        if (insertError) throw insertError;

        const { data: urlData, error: urlError } = await supabase.storage.from('muse-files').createSignedUrl(newItem.content, 60 * 5);
        if (urlError) throw urlError;
        
        const newItemWithUrl = { ...newItem, signedUrl: urlData.signedUrl };
        handleItemAdded(newItemWithUrl);

        toast.success("Image uploaded successfully!", { id: toastId });
      } catch (error: any) {
        console.error("Error during upload process:", error);
        toast.error("Upload failed", { id: toastId, description: error.message || "Please try again." });
      }
    },
    [user.id, supabase]
  );

  const { getRootProps, getInputProps, isDragActive, open: openFileDialog } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'] },
    noClick: true,
  });

  const handleItemAdded = (newItem: MuseItem) => {
    setMuseItems((prevItems) => [newItem, ...prevItems]);
    setIsPasteLinkModalOpen(false); 
  };

  return (
    <div {...getRootProps()} className="relative min-h-full flex-grow flex flex-col">
      <input {...getInputProps()} />

      <div className="flex-grow pt-8">
        {museItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted bg-muted/20 py-20 text-center">
            <h2 className="text-2xl font-semibold tracking-tight">
              It's a blank canvas
            </h2>
            <p className="mt-2 text-muted-foreground">
              Use the + button or drag and drop an image to start.
            </p>
          </div>
        ) : (
          // --- THIS IS THE KEY CHANGE ---
          // We've replaced the `grid` with a responsive, multi-column layout.
          // This creates the masonry effect automatically.
          <div
            className="w-full"
            style={{
              columnCount: 1,
              columnGap: '1rem',
            }}
            // Responsive column counts via media queries in Tailwind
            ref={(el) => {
              if (!el) return;
              el.style.columnCount = '1';
              if (window.matchMedia('(min-width: 640px)').matches) el.style.columnCount = '2';
              if (window.matchMedia('(min-width: 1024px)').matches) el.style.columnCount = '3';
              if (window.matchMedia('(min-width: 1280px)').matches) el.style.columnCount = '4';
            }}
          >
            {museItems.map((item, index) => (
              <MuseItemCard key={item.id} item={item} index={index} />
            ))}
          </div>
        )}
      </div>
      
      {isDragActive && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-lg">
          <div className="flex flex-col items-center justify-center text-center text-foreground p-8 border-2 border-dashed border-primary rounded-xl">
            <UploadCloudIcon className="size-16 text-primary" />
            <p className="mt-4 text-2xl font-bold">Drop your image here</p>
            <p className="text-muted-foreground">to add it to your Museboard</p>
          </div>
        </div>
      )}
      
      <MuseboardFAB 
        onUploadClick={openFileDialog} 
        onPasteLinkClick={() => setIsPasteLinkModalOpen(true)}
      />
      <PasteLinkModal 
        isOpen={isPasteLinkModalOpen}
        onOpenChange={setIsPasteLinkModalOpen}
        onItemAdded={handleItemAdded}
        user={user}
      />
    </div>
  );
}