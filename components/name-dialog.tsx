"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addReaction, postComment, setDisplayName } from "@/app/actions";
import { setNameDialogOpen, useUIState } from "@/lib/store";

export function NameDialog({ groupId }: { groupId?: string }) {
  const router = useRouter();
  const { nameDialogOpen, pendingAction } = useUIState((state) => ({
    nameDialogOpen: state.nameDialogOpen,
    pendingAction: state.pendingAction,
  }));
  const [displayName, setDisplayNameValue] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const handleClose = () => {
    setNameDialogOpen(false, null);
  };

  const handleSubmit = () => {
    setMessage(null);
    startTransition(async () => {
      const result = await setDisplayName(
        displayName,
        email || undefined,
        groupId
      );
      if (result?.error) {
        setMessage(result.error);
        return;
      }
      // Replay the pending action if any.
      if (pendingAction?.type === "reaction") {
        await addReaction(pendingAction.postId, pendingAction.emoji);
      }
      if (pendingAction?.type === "comment") {
        await postComment(pendingAction.postId, pendingAction.text);
      }
      setNameDialogOpen(false, null);
      setDisplayNameValue("");
      setEmail("");
      router.refresh();
    });
  };

  return (
    <Dialog
      open={nameDialogOpen}
      onOpenChange={(open) => !open && handleClose()}
    >
      <DialogContent className="sm:max-w-lg w-full rounded-t-3xl sm:rounded-2xl border-0 p-6 pb-7 shadow-2xl sm:shadow-xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:slide-in-from-bottom-8 data-[state=closed]:slide-out-to-bottom-8 top-auto translate-y-0 sm:top-1/2 sm:-translate-y-1/2">
        <DialogHeader>
          <DialogTitle>Choose a display name</DialogTitle>
          <DialogDescription>
            We keep identity simple. Set a display name for this group and
            optionally add an email.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="display-name">Display name</Label>
            <Input
              id="display-name"
              value={displayName}
              onChange={(e) => setDisplayNameValue(e.target.value)}
              placeholder="Your name"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="email">Email (optional)</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>
          {message ? (
            <p className="text-sm text-destructive">{message}</p>
          ) : null}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={handleClose} type="button">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={pending || !displayName.trim()}
            type="button"
          >
            {pending ? "Saving..." : "Save name"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
