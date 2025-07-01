// components/common/SettingsDialog.tsx

"use client";

import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AccountForm } from "@/components/auth/account-form";
import type { User } from "@supabase/supabase-js";
import { ReactNode, Suspense } from "react";
import { Loader2, Settings, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Profile = {
  full_name: string | null;
  avatar_url: string | null;
} | null;

interface SettingsDialogProps {
  user: User;
  profile: Profile;
  trashViewContent: ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function SettingsDialog({ user, profile, trashViewContent, open, onOpenChange }: SettingsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(
        // --- THIS IS THE FIX: Replaced 'glow-primary' with 'glow-drop-shadow' ---
        "max-w-4xl w-full h-[640px] p-0 gap-0 border-0",
        "glow-drop-shadow"
      )}>
        <Tabs defaultValue="general" className="grid grid-cols-4 h-full overflow-hidden rounded-lg"> {/* Added overflow-hidden and rounded-lg here */}
          
          <div className="col-span-1 flex flex-col items-start gap-4 p-4 border-r border-border/80 bg-card/50">
            <DialogTitle className="text-xl font-bold px-3 pb-2">Settings</DialogTitle>
            
            <TabsList className="flex-col h-auto items-start justify-start bg-transparent p-0 gap-1 w-full">
              <TabsTrigger value="general" className="w-full justify-start text-sm font-normal py-2 px-3 gap-2 data-[state=active]:bg-muted">
                <Settings className="size-4" />
                General
              </TabsTrigger>
              <TabsTrigger value="trash" className="w-full justify-start text-sm font-normal py-2 px-3 gap-2 data-[state=active]:bg-muted">
                <Trash2 className="size-4" />
                Trash
              </TabsTrigger>
            </TabsList>
          </div>
          
          <div className="col-span-3 overflow-y-auto">
            <TabsContent value="general" className="p-6 m-0">
              <AccountForm user={user} profile={profile} />
            </TabsContent>
            <TabsContent value="trash" className="p-6 m-0">
              <Suspense fallback={<div className="flex justify-center items-center h-full"><Loader2 className="animate-spin size-6" /></div>}>
                {trashViewContent}
              </Suspense>
            </TabsContent>
          </div>

        </Tabs>
      </DialogContent>
    </Dialog>
  );
}