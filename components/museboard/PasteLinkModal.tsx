// components/museboard/PasteLinkModal.tsx
"use client";

import { useState } from "react";
import { User } from "@supabase/supabase-js";
import { MuseItem } from "@/app/(private)/museboard/page";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface PasteLinkModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onItemAdded: (item: MuseItem) => void;
  user: User;
}

export default function PasteLinkModal({ isOpen, onOpenChange, onItemAdded, user }: PasteLinkModalProps) {
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    const formData = new FormData(event.currentTarget);
    const link = formData.get("link") as string;

    if (!link || !link.trim()) {
      toast.error("Please enter a valid link.");
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("muse_items")
        .insert({
          user_id: user.id,
          content: link.trim(),
          content_type: 'link',
          description: "Link added via FAB" // A default description
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // TODO: This is the AI skeleton hook. In the future, we will trigger
      // a serverless function here to process the link in the background.
      // e.g., processLinkWithAI(data.id, data.content);

      toast.success("Link added to Museboard!");
      onItemAdded(data as MuseItem);
      onOpenChange(false); // Close the modal

    } catch (error: any) {
      console.error("Error adding link:", error);
      toast.error("Failed to add link", { description: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Paste a Link</DialogTitle>
          <DialogDescription>
            Add a new piece of inspiration from the web. The content will be analyzed later.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="link" className="sr-only">Link</Label>
            <Input id="link" name="link" placeholder="https://example.com" required autoFocus />
          </div>
          <Button type="submit" disabled={loading}>
            {loading ? "Adding..." : "Add to Museboard"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}