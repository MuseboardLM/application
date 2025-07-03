// components/museboard/AddMuseItemForm.tsx
"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { MuseItem } from "@/app/(private)/museboard/page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface AddMuseItemFormProps {
  userId: string;
  onItemAdded: (newItem: MuseItem) => void;
}

const contentTypes = ["text", "note", "tweet", "link", "image", "video", "screenshot", "article"];
// ✨ NEW: Define which types should be treated as images for the file upload
const imageTypes = ["image", "screenshot"];

export default function AddMuseItemForm({ userId, onItemAdded }: AddMuseItemFormProps) {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  // ✨ NEW: State to manage the selected content type and the file
  const [contentType, setContentType] = useState("text");
  const [file, setFile] = useState<File | null>(null);

  // ⬇️ MODIFIED: Completely new logic to handle both text and file uploads
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const description = formData.get("description") as string;
    const sourceUrl = formData.get("sourceUrl") as string;
    let content: string | null = formData.get("content") as string;
    let finalContentType = contentType;

    // --- Image Upload Logic ---
    if (imageTypes.includes(finalContentType)) {
      if (!file) {
        toast.error("No file selected", { description: "Please select an image to upload." });
        setLoading(false);
        return;
      }

      // Create a unique file path
      const fileName = `${Date.now()}-${file.name}`;
      const filePath = `${userId}/${fileName}`;

      // Upload the file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('muse-files')
        .upload(filePath, file);

      if (uploadError) {
        toast.error("Upload failed", { description: uploadError.message });
        setLoading(false);
        return;
      }
      // The 'content' of an image item is its path in storage
      content = filePath;
    }
    // --- End Image Upload Logic ---

    if (!content || !content.trim()) {
      toast.error("Content is missing", { description: "Please provide content or an image for your muse." });
      setLoading(false);
      return;
    }

    // Insert the new item into the database
    const { data: newItem, error: insertError } = await supabase
      .from("muse_items")
      .insert({
        user_id: userId,
        content: content.trim(),
        content_type: finalContentType,
        description: description.trim() || null,
        source_url: sourceUrl.trim() || null,
      })
      .select()
      .single();

    if (insertError) {
      toast.error("Failed to add muse item", { description: insertError.message });
      setLoading(false);
      return;
    }

    // ✨ NEW: If it was an image, call our Edge Function to get dimensions
    if (imageTypes.includes(finalContentType)) {
      try {
        const { error: functionError } = await supabase.functions.invoke('get-image-dimensions', {
          body: { key: content },
        });
        if (functionError) throw functionError;
        console.log("Edge function invoked successfully to get image dimensions.");
      } catch (e) {
        // Log this error but don't block the user, as the item is already saved
        console.error("Error invoking get-image-dimensions function:", e);
        toast.warning("Could not get image dimensions", { description: "The muse item was saved, but its dimensions could not be processed." });
      }
    }

    toast.success("Success!", { description: "Your muse item has been added." });
    onItemAdded(newItem as MuseItem);
    setLoading(false);
    // Reset form fields
    (event.target as HTMLFormElement).reset();
    setFile(null);
    setContentType("text");
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 py-4">
      {/* ⬇️ MODIFIED: Conditionally show Textarea or File Input */}
      <div className="grid gap-2">
        <Label htmlFor="contentType">Type*</Label>
        <Select name="contentType" value={contentType} onValueChange={setContentType} required>
          <SelectTrigger>
            <SelectValue placeholder="Select a type" />
          </SelectTrigger>
          <SelectContent>
            {contentTypes.map((type) => (
              <SelectItem key={type} value={type}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {imageTypes.includes(contentType) ? (
        <div className="grid gap-2">
          <Label htmlFor="file">Image*</Label>
          <Input id="file" type="file" required onChange={(e) => setFile(e.target.files?.[0] || null)} />
        </div>
      ) : (
        <div className="grid gap-2">
          <Label htmlFor="content">Content*</Label>
          <Textarea
            id="content"
            name="content"
            placeholder="What's inspiring you today? A quote, a thought, or a URL..."
            required
            rows={5}
          />
        </div>
      )}

      <div className="grid gap-2">
        <Label htmlFor="description">Description (Optional)</Label>
        <Input
          id="description"
          name="description"
          placeholder="A brief reflection or context for this item"
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="sourceUrl">Source URL (Optional)</Label>
        <Input
          id="sourceUrl"
          name="sourceUrl"
          type="url"
          placeholder="e.g., https://twitter.com/..."
        />
      </div>
      <Button type="submit" disabled={loading} className="w-full mt-2">
        {loading ? "Adding..." : "Add Muse Item"}
      </Button>
    </form>
  );
}