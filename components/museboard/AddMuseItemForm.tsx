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
import { toast } from "sonner"; // Import the Sonner toast function

interface AddMuseItemFormProps {
  userId: string;
  onItemAdded: (newItem: MuseItem) => void;
}

const contentTypes = ["text", "note", "tweet", "link", "image", "video", "screenshot", "article"];

export default function AddMuseItemForm({ userId, onItemAdded }: AddMuseItemFormProps) {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const content = formData.get("content") as string;
    const contentType = formData.get("contentType") as string;
    const description = formData.get("description") as string;
    const sourceUrl = formData.get("sourceUrl") as string;

    if (!content.trim() || !contentType) {
      toast.error("Missing fields", {
        description: "Please provide content and a type for your muse.",
      });
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("muse_items")
      .insert({
        user_id: userId,
        content: content.trim(),
        content_type: contentType,
        description: description.trim() || null,
        source_url: sourceUrl.trim() || null,
      })
      .select()
      .single();

    if (error) {
      console.error("Error adding muse item:", error);
      toast.error("Failed to add muse item", {
        description: error.message,
      });
    } else if (data) {
      toast.success("Success!", {
        description: "Your muse item has been added.",
      });
      onItemAdded(data as MuseItem);
    }

    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 py-4">
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
      <div className="grid gap-2">
        <Label htmlFor="contentType">Type*</Label>
        <Select name="contentType" defaultValue="text" required>
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