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
// --- ADDED ---
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
  // --- ADDED --- New state for the paste link modal
  const [isPasteLinkModalOpen, setIsPasteLinkModalOpen] = useState(false);
  const supabase = createClient();

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      // (This entire onDrop function remains exactly the same as before)
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

  // The 'open' function programmatically triggers the file selection dialog
  const { getRootProps, getInputProps, isDragActive, open: openFileDialog } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'] },
    noClick: true, // We trigger this manually now
  });

  // This single handler now works for items added via drop, upload, or paste
  const handleItemAdded = (newItem: MuseItem) => {
    setMuseItems((prevItems) => [newItem, ...prevItems]);
    // Close the paste link modal if it was open
    setIsPasteLinkModalOpen(false); 
  };

  return (
    <div {...getRootProps()} className="relative min-h-full flex-grow flex flex-col">
      <input {...getInputProps()} />

      {/* --- REMOVED --- The old header with H1 and Dialog has been deleted. */}

      {/* Grid or Empty State */}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {museItems.map((item) => (
              <MuseItemCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
      
      {/* Dropzone Overlay */}
      {isDragActive && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-lg">
          <div className="flex flex-col items-center justify-center text-center text-foreground p-8 border-2 border-dashed border-primary rounded-xl">
            <UploadCloudIcon className="size-16 text-primary" />
            <p className="mt-4 text-2xl font-bold">Drop your image here</p>
            <p className="text-muted-foreground">to add it to your Museboard</p>
          </div>
        </div>
      )}
      
      {/* --- ADDED --- The new components for capturing content */}
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