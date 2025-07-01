// components/museboard/TrashClientWrapper.tsx

"use client";

import { useState } from "react";
import { MuseItem } from "@/app/(private)/museboard/page";
import { toast } from "sonner";
import TrashItemCard from "./TrashItemCard";
import { restoreMuseItems, permanentlyDeleteMuseItems } from "@/app/(private)/museboard/actions";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { RotateCw, Trash2Icon, XIcon } from "lucide-react";

interface TrashClientWrapperProps {
  initialTrashItems: (MuseItem & { signedUrl?: string })[];
}

export default function TrashClientWrapper({ initialTrashItems }: TrashClientWrapperProps) {
  const [trashItems, setTrashItems] = useState(initialTrashItems);
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());

  const handleToggleSelect = (itemId: string) => {
    const newSelection = new Set(selectedItemIds);
    if (newSelection.has(itemId)) {
      newSelection.delete(itemId);
    } else {
      newSelection.add(itemId);
    }
    setSelectedItemIds(newSelection);
  };

  const handleClearSelection = () => setSelectedItemIds(new Set());

  const handleRestore = async (itemIds: string[]) => {
    const toastId = toast.loading(`Restoring ${itemIds.length} item(s)...`);
    const originalItems = [...trashItems];
    setTrashItems(originalItems.filter(item => !itemIds.includes(item.id)));
    const result = await restoreMuseItems(itemIds);
    if (result.error) {
      toast.error("Restore failed", { id: toastId, description: result.error });
      setTrashItems(originalItems);
    } else {
      toast.success("Item(s) restored!", { id: toastId });
    }
    handleClearSelection();
  };

  const handlePermanentDelete = async (itemIds: string[]) => {
    const toastId = toast.loading(`Permanently deleting ${itemIds.length} item(s)...`);
    const originalItems = [...trashItems];
    setTrashItems(originalItems.filter(item => !itemIds.includes(item.id)));
    const result = await permanentlyDeleteMuseItems(itemIds);
    if (result.error) {
      toast.error("Deletion failed", { id: toastId, description: result.error });
      setTrashItems(originalItems);
    } else {
      toast.success("Item(s) permanently deleted!", { id: toastId });
    }
    handleClearSelection();
  };

  return (
    <div className="relative">
      {trashItems.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-lg font-semibold">Trash is empty</p>
          <p className="text-muted-foreground">Deleted items will appear here for 30 days.</p>
        </div>
      ) : (
        <div style={{ columnCount: 3, columnGap: '1rem' }}>
          {trashItems.map((item) => (
            <TrashItemCard
              key={item.id}
              item={item}
              isSelected={selectedItemIds.has(item.id)}
              onToggleSelect={() => handleToggleSelect(item.id)}
              onRestore={() => handleRestore([item.id])}
              onPermanentDelete={() => handlePermanentDelete([item.id])}
            />
          ))}
        </div>
      )}

      <AnimatePresence>
        {selectedItemIds.size > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 p-3 bg-zinc-900/80 backdrop-blur-md rounded-xl border border-zinc-700 shadow-2xl"
          >
            <p className="text-sm font-medium text-zinc-300 w-24 text-center">{selectedItemIds.size} selected</p>
            <Button size="sm" onClick={() => handleRestore(Array.from(selectedItemIds))}>
              <RotateCw className="mr-2 size-4" />
              Restore
            </Button>
            <Button variant="destructive" size="sm" onClick={() => handlePermanentDelete(Array.from(selectedItemIds))}>
              <Trash2Icon className="mr-2 size-4" />
              Delete
            </Button>
            <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white" onClick={handleClearSelection}>
              <XIcon className="size-5" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}