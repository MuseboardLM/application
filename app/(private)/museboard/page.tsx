// app/(private)/museboard/page.tsx

import { redirect } from "next/navigation";
import { createServer } from "@/lib/supabase/server";
import MuseboardClientWrapper from "@/components/museboard/MuseboardClientWrapper";

export type MuseItem = {
  id: string;
  user_id: string;
  created_at: string;
  content: string;
  content_type: string;
  description: string | null;
  source_url: string | null;
  ai_categories: string[] | null;
  ai_clusters: string[] | null;
  signedUrl?: string;
  deleted_at: string | null; // --- ADD THIS LINE ---
};

export default async function MuseboardPage() {
  const supabase = createServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  // NOTE: This query is already correct because your RLS policy
  // (deleted_at IS NULL) is automatically applied by the database.
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

  const itemsWithSignedUrls = await Promise.all(
    (museItems || []).map(async (item) => {
      if (item.content_type === 'image' || item.content_type === 'screenshot') {
        const { data, error: urlError } = await supabase.storage
          .from('muse-files')
          .createSignedUrl(item.content, 60 * 5);

        if (urlError) {
          console.error(`Error creating signed URL for ${item.content}:`, urlError);
          return { ...item, signedUrl: undefined };
        }
        return { ...item, signedUrl: data.signedUrl };
      }
      return item;
    })
  );

  return (
    <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      <MuseboardClientWrapper initialMuseItems={itemsWithSignedUrls} user={user} />
    </div>
  );
}