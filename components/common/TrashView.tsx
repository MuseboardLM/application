// components/common/TrashView.tsx

import { createServer } from "@/lib/supabase/server";
import TrashClientWrapper from "@/components/museboard/TrashClientWrapper";

export default async function TrashView() {
  const supabase = await createServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: trashItems } = await supabase
    .from("muse_items")
    .select("*")
    .eq("user_id", user.id)
    .not("deleted_at", "is", null) // Fetch only items that HAVE a deleted_at timestamp
    .order("deleted_at", { ascending: false });

  const itemsWithSignedUrls = await Promise.all(
    (trashItems || []).map(async (item) => {
      if ((item.content_type === 'image' || item.content_type === 'screenshot') && item.content) {
        const { data } = await supabase.storage.from('muse-files').createSignedUrl(item.content, 60 * 5);
        return { ...item, signedUrl: data?.signedUrl };
      }
      return item;
    })
  );

  return <TrashClientWrapper initialTrashItems={itemsWithSignedUrls} />;
}