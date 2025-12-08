"use client";

import { upload } from "@vercel/blob/client";
import { FormEvent, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { createPost } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { generateVideoThumbnail } from "@/lib/video";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { setNewPostDialogOpen, useUIState } from "@/lib/store";

export function NewPostDialog({ groupId }: { groupId?: string }) {
  const router = useRouter();
  const { newPostDialogOpen } = useUIState((state) => ({
    newPostDialogOpen: state.newPostDialogOpen,
  }));
  const formRef = useRef<HTMLFormElement>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    const form = event.currentTarget;
    const formData = new FormData(form);

    startTransition(async () => {
      try {
        const uploadUrl = groupId
          ? `/api/upload?groupId=${groupId}`
          : "/api/upload";

        const file = formData.get("video") as File;
        if (file && file.size > 0) {
          try {
            const thumbBlob = await generateVideoThumbnail(file);
            const thumbFile = new File([thumbBlob], "thumbnail.jpg", {
              type: "image/jpeg",
            });
            const thumbUpload = await upload(thumbFile.name, thumbFile, {
              access: "public",
              handleUploadUrl: uploadUrl,
            });
            formData.set("thumbnailUrl", thumbUpload.url);
          } catch (e) {
            console.error("Failed to generate thumbnail", e);
          }

          const blob = await upload(file.name, file, {
            access: "public",
            handleUploadUrl: uploadUrl,
          });
          formData.set("videoUrl", blob.url);
        }

        // Remove the file from formData so it's not sent to the server function
        formData.delete("video");

        const imageFiles = formData.getAll("images") as File[];
        const imageUrls: string[] = [];
        if (imageFiles.length > 0) {
          await Promise.all(
            imageFiles.map(async (file) => {
              if (file.size > 0) {
                const blob = await upload(file.name, file, {
                  access: "public",
                  handleUploadUrl: uploadUrl,
                });
                imageUrls.push(blob.url);
              }
            })
          );
        }
        formData.delete("images");

        const result = await createPost(
          formData.get("title")?.toString() || null,
          formData.get("body")?.toString() || null,
          formData.get("videoUrl")?.toString() || null,
          imageUrls.length > 0 ? imageUrls : null,
          groupId,
          formData.get("thumbnailUrl")?.toString() || null
        );

        if (result.error) {
          setMessage(result.error || "Failed to create post");
          return;
        }

        formRef.current?.reset();
        setNewPostDialogOpen(false);
        router.refresh();
      } catch (error) {
        console.error(error);
        setMessage("Something went wrong");
      }
    });
  };

  return (
    <Dialog
      open={newPostDialogOpen}
      onOpenChange={(open) => setNewPostDialogOpen(open)}
    >
      <DialogTrigger asChild>
        <Button onClick={() => setNewPostDialogOpen(true)}>New post</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New post</DialogTitle>
          <DialogDescription>
            Admins can attach an optional video along with text.
          </DialogDescription>
        </DialogHeader>
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="title">Title</Label>
            <Input name="title" id="title" placeholder="Trip planning" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="body">Body</Label>
            <Textarea
              name="body"
              id="body"
              placeholder="What should we pack?"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="video">Optional video</Label>
            <Input name="video" id="video" type="file" accept="video/*" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="images">Photos</Label>
            <Input
              name="images"
              id="images"
              type="file"
              accept="image/*"
              multiple
            />
          </div>
          {message ? (
            <p className="text-sm text-destructive">{message}</p>
          ) : null}
          <DialogFooter>
            <Button
              variant="ghost"
              type="button"
              onClick={() => setNewPostDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Posting..." : "Create post"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
