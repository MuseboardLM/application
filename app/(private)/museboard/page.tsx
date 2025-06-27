// app/museboard/page.tsx

import { redirect } from "next/navigation";
import { createServer } from "@/lib/supabase/server";
import MuseboardClientWrapper from "@/components/museboard/MuseboardClientWrapper";

// **CHANGE #1**: We've added the optional `signedUrl` property to our type.
// This will hold the temporary, secure URL for displaying images.
export type MuseItem = {
  id: string;
  user_id: string;
  created_at: string;
  content: string; // For images, this will be the file path, not a public URL
  content_type: string;
  description: string | null;
  source_url: string | null;
  ai_categories: string[] | null;
  ai_clusters: string[] | null;
  signedUrl?: string;
};

export default async function MuseboardPage() {
  const supabase = createServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  const { data: museItems, error } = await supabase
    .from("muse_items")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching muse items:", error.message);
    return (
      <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center p-4">
        <p className="text-destructive">
          Could not load your Museboard. Please try refreshing the page.
        </p>
      </div>
    );
  }

  // **CHANGE #2**: This is the new logic block.
  // We iterate through the fetched items and generate secure, temporary signed URLs
  // for any item that is an image or screenshot.
  const itemsWithSignedUrls = await Promise.all(
    (museItems || []).map(async (item) => {
      if (item.content_type === 'image' || item.content_type === 'screenshot') {
        // Remember to use the correct bucket name you chose: 'muse-files'
        const { data, error: urlError } = await supabase.storage
          .from('muse-files')
          .createSignedUrl(item.content, 60 * 5); // URL is valid for 5 minutes

        if (urlError) {
          console.error(`Error creating signed URL for ${item.content}:`, urlError);
          // If URL generation fails, return the item without it so the app doesn't crash
          return { ...item, signedUrl: undefined };
        }
        // If successful, return the item with the new signedUrl property
        return { ...item, signedUrl: data.signedUrl };
      }
      // If it's not an image, just return the item as is.
      return item;
    })
  );

  return (
    <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* **CHANGE #3**: We now pass the new, enriched array to our client component. */}
      <MuseboardClientWrapper initialMuseItems={itemsWithSignedUrls} user={user} />
    </div>
  );
}