"use client";

import { useMemo, useState, useTransition, useOptimistic } from "react";
import { MessageCircle, Smile, Plus } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { CommentList, type CommentWithAuthor } from "@/components/comment-list";
import { CommentForm } from "@/components/comment-form";
import { addReaction } from "@/app/actions";
import { cn, formatDate } from "@/lib/utils";
import { setNameDialogOpen } from "@/lib/store";

const ALL_EMOJIS = [
  "👍", "👎", "❤️", "😂", "😮", "😢", "😡", "👏", "🎉", "🔥", "💯", "👀",
  "🤝", "🙏", "💪", "🧠", "🚀", "🤔", "🤷", "🤡", "💩", "👻", "💀", "👽",
];

type Props = {
  postId: string;
  post: {
    title: string | null;
    body: string | null;
    createdAt: Date | string;
    videoUrl: string | null;
    imageUrls: string[] | null;
  };
  counts: Record<string, number>;
  comments: CommentWithAuthor[];
  isAdmin: boolean;
};

export function PostInteractionLayer({
  postId,
  post,
  counts,
  comments,
  isAdmin,
}: Props) {
  const [optimisticCounts, addOptimisticReaction] = useOptimistic(
    counts,
    (state, newEmoji: string) => ({
      ...state,
      [newEmoji]: (state[newEmoji] ?? 0) + 1,
    })
  );

  const [pending, startTransition] = useTransition();
  const [reactionDrawerOpen, setReactionDrawerOpen] = useState(false);

  const activeReactions = useMemo(() => {
    return Object.entries(optimisticCounts)
      .filter(([_, count]) => count > 0)
      .sort((a, b) => b[1] - a[1]); // Sort by count desc
  }, [optimisticCounts]);

  const totalReactions = Object.values(optimisticCounts).reduce(
    (a, b) => a + b,
    0
  );

  const handleReact = (emoji: string) => {
    setReactionDrawerOpen(false);
    startTransition(async () => {
      addOptimisticReaction(emoji);
      const result = await addReaction(postId, emoji);
      if (result?.needsProfile) {
        setNameDialogOpen(true, { type: "reaction", postId, emoji });
        return;
      }
    });
  };

  const isMediaPost =
    !!post.videoUrl || (post.imageUrls && post.imageUrls.length > 0);

  return (
    <>
      {/* Bottom Left Info & Reactions */}
      <div className="absolute bottom-0 left-0 right-16 z-10 p-4 pb-8 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none">
        <div className="space-y-3 pointer-events-auto">
          {/* Text Info */}
          {isMediaPost && (
            <div className="space-y-2">
              <h1 className="text-lg font-bold text-white drop-shadow-md line-clamp-2">
                {post.title || "Untitled Post"}
              </h1>
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <time dateTime={new Date(post.createdAt).toISOString()}>
                  {formatDate(post.createdAt)}
                </time>
              </div>
              {post.body && (
                <p className="text-sm text-white/90 drop-shadow-sm line-clamp-3">
                  {post.body}
                </p>
              )}
            </div>
          )}

          {/* Existing Reactions */}
          {activeReactions.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {activeReactions.map(([emoji, count]) => (
                <div
                  key={emoji}
                  className="flex items-center gap-1 rounded-full bg-black/40 px-2 py-1 text-xs font-medium text-white backdrop-blur-sm"
                >
                  <span className="text-sm">{emoji}</span>
                  <span>{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Sidebar Actions */}
      <div className="absolute bottom-20 right-2 z-20 flex flex-col items-center gap-6">
        {/* Reaction Drawer Trigger */}
        <Drawer open={reactionDrawerOpen} onOpenChange={setReactionDrawerOpen}>
          <DrawerTrigger asChild>
            <div className="flex flex-col items-center gap-1 cursor-pointer group">
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-12 w-12 rounded-full bg-black/20 text-white backdrop-blur-sm hover:bg-black/40",
                  pending && "opacity-70"
                )}
              >
                <Smile
                  className={cn(
                    "h-7 w-7",
                    (optimisticCounts["❤️"] || 0) > 0
                      ? "text-yellow-400 fill-yellow-400"
                      : "text-white"
                  )}
                />
              </Button>
              <span className="text-xs font-bold text-white shadow-black drop-shadow-md">
                {totalReactions}
              </span>
            </div>
          </DrawerTrigger>
          <DrawerContent className="fixed bottom-0 left-0 right-0 max-h-[50vh] outline-none">
            <div className="mx-auto w-full max-w-sm">
              <DrawerHeader>
                <DrawerTitle className="text-center">Choose a Reaction</DrawerTitle>
              </DrawerHeader>
              <div className="grid grid-cols-6 gap-2 p-4 pb-8">
                {ALL_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    className="flex aspect-square items-center justify-center rounded-xl text-2xl hover:bg-slate-100 active:scale-90 transition-transform"
                    onClick={() => handleReact(emoji)}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          </DrawerContent>
        </Drawer>

        {/* Comments Drawer */}
        <Drawer>
          <DrawerTrigger asChild>
            <div className="flex flex-col items-center gap-1 cursor-pointer group">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black/20 text-white backdrop-blur-sm transition-colors group-hover:bg-black/40">
                <MessageCircle className="h-7 w-7 fill-white/90" />
              </div>
              <span className="text-xs font-bold text-white shadow-black drop-shadow-md">
                {comments.length}
              </span>
            </div>
          </DrawerTrigger>
          <DrawerContent className="fixed bottom-0 left-0 right-0 max-h-[85vh] outline-none">
            <div className="mx-auto w-full max-w-md h-full flex flex-col">
              <DrawerHeader className="border-b pb-4">
                <DrawerTitle className="text-center">
                  Comments ({comments.length})
                </DrawerTitle>
              </DrawerHeader>
              <div className="flex-1 overflow-y-auto p-4 scrollbar-hide">
                <CommentList
                  comments={comments}
                  isAdmin={isAdmin}
                  postId={postId}
                />
              </div>
              <div className="border-t p-4 pb-8 bg-white">
                <CommentForm postId={postId} autoFocus={false} />
              </div>
            </div>
          </DrawerContent>
        </Drawer>
      </div>
    </>
  );
}

