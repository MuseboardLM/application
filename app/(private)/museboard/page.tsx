// app/(private)/museboard/page.tsx

import { redirect } from "next/navigation";
import { createServer } from "@/lib/supabase/server";
import MuseboardClientWrapper from "@/components/museboard/MuseboardClientWrapper";

export type MuseItem = {
  id: string;
  user_id: string;
  created_at: string;
  content: string | null;
  content_type: "text" | "image" | "link" | "screenshot";
  description: string | null;
  source_url: string | null;
  ai_categories: string[] | null;
  ai_clusters: string[] | null;
  deleted_at: string | null;
  // Add missing image dimension properties
  image_width: number | null;
  image_height: number | null;
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

  // Fetch muse items with pagination for better performance
  const itemsPerPage = 50; // Limit initial load
  const { data: museItems, error: itemsError } = await supabase
    .from("muse_items")
    .select("*")
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(itemsPerPage); // Add pagination

  if (itemsError) {
    console.error("Error fetching muse items:", itemsError.message);
    return (
      <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center p-4">
        <p className="text-destructive">
          Could not load your Museboard. Please try refreshing the page.
        </p>
      </div>
    );
  }

  const imagePaths = (museItems || [])
    .filter(
      (item): item is MuseItem & { content: string } =>
        (item.content_type === "image" || item.content_type === "screenshot") &&
        typeof item.content === "string"
    )
    .map((item) => item.content);

  let signedUrlMap: Map<string, string> = new Map();

  if (imagePaths.length > 0) {
    // Create signed URLs with longer expiry to reduce egress from frequent regeneration
    const { data: signedUrlsData, error: signedUrlsError } =
      await supabase.storage
        .from("muse-files")
        .createSignedUrls(imagePaths, 60 * 60 * 24); // 24 hours instead of 5 minutes

    if (signedUrlsError) {
      console.error("Error creating signed URLs:", signedUrlsError.message);
    } else {
      for (const urlData of signedUrlsData) {
        if (urlData.signedUrl && urlData.path) {
          signedUrlMap.set(urlData.path, urlData.signedUrl);
        }
      }
    }
  }

  const itemsWithSignedUrls = (museItems || []).map((item) => {
    if (item.content && signedUrlMap.has(item.content)) {
      return { ...item, signedUrl: signedUrlMap.get(item.content) };
    }
    return item;
  });

  return (
    <MuseboardClientWrapper
      initialMuseItems={itemsWithSignedUrls}
      user={user}
    />
  );
}