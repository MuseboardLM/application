// app/(private)/museboard/page.tsx

import { redirect } from "next/navigation";
import { createServer } from "@/lib/supabase/server";
import { searchMuseItems } from "@/lib/actions";
import { MuseItem, MuseItemSort } from "@/lib/types";
import MuseboardClientWrapper from "@/components/museboard/MuseboardClientWrapper";

export default async function MuseboardPage({ 
  searchParams 
}: { 
  searchParams: { [key: string]: string | string[] | undefined } 
}) {
  const supabase = createServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  // --- Parse search and sort params from URL ---
  const query = typeof searchParams.q === 'string' ? searchParams.q : '';
  const sortField = typeof searchParams.sort === 'string' ? searchParams.sort : 'created_at';
  const sortDir = typeof searchParams.dir === 'string' ? searchParams.dir : 'desc';

  const sort: MuseItemSort = {
    field: sortField as MuseItemSort['field'],
    direction: sortDir as MuseItemSort['direction'],
  };

  // --- Fetch items using the server action ---
  const { data: museItems, error: itemsError } = await searchMuseItems(query, { sort });

  if (itemsError) {
    console.error("Error fetching muse items:", itemsError);
    return (
      <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center p-4">
        <p className="text-destructive">
          Could not load your Museboard. Please try refreshing the page.
        </p>
      </div>
    );
  }

  // --- Generate Signed URLs (same logic as before) ---
  const imagePaths = (museItems || [])
    .filter(
      (item): item is MuseItem & { content: string } =>
        (item.content_type === "image" || item.content_type === "screenshot") &&
        typeof item.content === "string"
    )
    .map((item) => item.content);

  let signedUrlMap: Map<string, string> = new Map();
  if (imagePaths.length > 0) {
    const { data: signedUrlsData, error: signedUrlsError } =
      await supabase.storage
        .from("muse-files")
        .createSignedUrls(imagePaths, 60 * 60 * 24); // 24 hours

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