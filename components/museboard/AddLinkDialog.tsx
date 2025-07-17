// components/museboard/AddLinkDialog.tsx

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Link2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { addContentToMuseboardAction } from "@/lib/actions";

interface AddLinkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AddLinkDialog({ open, onOpenChange }: AddLinkDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    
    const formData = new FormData(event.currentTarget);
    const link = formData.get("link") as string;

    if (!link || !link.trim()) {
      toast.error("Please enter a valid URL.");
      setIsLoading(false);
      return;
    }

    const result = await addContentToMuseboardAction(link, 'link');

    if (result.success) {
      toast.success("Link added to your Museboard!");
      onOpenChange(false); // Close the dialog
      router.refresh(); // Refresh the page to show the new item
    } else {
      toast.error(result.error || "Failed to add link. Please try again.");
    }
    
    setIsLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-zinc-900 border-zinc-800">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Add from Link
          </DialogTitle>
          <DialogDescription>
            Paste a URL below to add it to your Museboard.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            id="link"
            name="link"
            placeholder="https://example.com"
            className="bg-zinc-800 border-zinc-700 h-10"
            disabled={isLoading}
            autoFocus
          />
          <Button type="submit" disabled={isLoading} className="bg-white text-black hover:bg-zinc-200">
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              "Add Link"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}