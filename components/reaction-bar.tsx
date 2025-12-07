"use client";

import { useMemo, useState, useTransition, useOptimistic } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

import { addReaction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { setNameDialogOpen } from "@/lib/store";
import { cn } from "@/lib/utils";
import { EmojiRain } from "@/components/emoji-rain";

const ALL_EMOJIS = [
  "👍", "👎", "❤️", "😂", "😮", "😢", "😡", "👏", "🎉", "🔥", "💯", "👀",
  "🤝", "🙏", "💪", "🧠", "🚀", "🤔", "🤷", "🤡", "💩", "👻", "💀", "👽",
];

type Props = {
  postId: string;
  counts: Record<string, number>;
};

export function ReactionBar({ postId, counts }: Props) {
  const router = useRouter();
  const [optimisticCounts, addOptimisticReaction] = useOptimistic(
    counts,
    (state, newEmoji: string) => ({
      ...state,
      [newEmoji]: (state[newEmoji] ?? 0) + 1,
    })
  );

  const activeReactions = useMemo(() => {
    return Object.entries(optimisticCounts)
      .filter(([_, count]) => count > 0)
      .sort((a, b) => a[0].localeCompare(b[0]));
  }, [optimisticCounts]);

  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeEmoji, setActiveEmoji] = useState<string | null>(null);
  const [customEmoji, setCustomEmoji] = useState("");

  const handleReact = (emoji: string) => {
    setMessage(null);
    setPopoverOpen(false);
    setDialogOpen(false);
    setCustomEmoji("");

    setActiveEmoji(null);
    setTimeout(() => setActiveEmoji(emoji), 10);

    startTransition(async () => {
      addOptimisticReaction(emoji);
      const result = await addReaction(postId, emoji);
      if (result?.needsProfile) {
        setNameDialogOpen(true, { type: "reaction", postId, emoji });
        return;
      }
      if (result?.error) {
        setMessage(result.error);
      } else {
        router.refresh();
      }
    });
  };

  return (
    <div className="relative">
      <EmojiRain emoji={activeEmoji} />
      
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          {activeReactions.map(([emoji, count]) => (
            <Button
              key={emoji}
              type="button"
              size="sm"
              variant="secondary"
              className={cn(
                "group relative h-8 gap-1.5 rounded-full px-3 text-sm font-normal ring-1 ring-slate-200 transition-all hover:ring-slate-300",
                "bg-white hover:bg-slate-50",
                pending && "opacity-70"
              )}
              onClick={() => handleReact(emoji)}
              disabled={pending}
            >
              <span className="text-base leading-none">{emoji}</span>
              <span className="text-xs text-slate-600 font-medium">
                {count}
              </span>
            </Button>
          ))}

          <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 rounded-full p-0 text-slate-500 ring-1 ring-slate-200 hover:bg-slate-50 hover:text-slate-900 border-0"
              >
                <Plus className="h-4 w-4" />
                <span className="sr-only">Add reaction</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-2 sm:w-[340px]" align="start">
              <div className="grid grid-cols-8 gap-1">
                {ALL_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-slate-100 text-lg transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-slate-400"
                    onClick={() => handleReact(emoji)}
                    disabled={pending}
                    type="button"
                  >
                    {emoji}
                  </button>
                ))}
                
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild>
                    <button
                      className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-slate-100 text-lg transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-slate-400"
                      type="button"
                    >
                      <Plus className="h-4 w-4 text-slate-500" />
                    </button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Add Custom Reaction</DialogTitle>
                      <DialogDescription>
                        Enter a single emoji to react to this post.
                      </DialogDescription>
                    </DialogHeader>
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (customEmoji) {
                          handleReact(customEmoji);
                        }
                      }}
                      className="flex items-center gap-4 py-4"
                    >
                      <div className="relative flex-1">
                        <Input
                          id="emoji"
                          className="text-center text-4xl h-20"
                          value={customEmoji}
                          onChange={(e) => {
                            const val = e.target.value;
                            const chars = [...val];
                            if (chars.length > 0) {
                              setCustomEmoji(chars[chars.length - 1]);
                            } else {
                              setCustomEmoji("");
                            }
                          }}
                          placeholder="🔥"
                          autoFocus
                          maxLength={2}
                        />
                      </div>
                      <Button type="submit" size="lg" disabled={!customEmoji || pending}>
                        React
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </PopoverContent>
          </Popover>
        </div>
        
        {message ? (
          <p className="text-sm text-destructive animate-in fade-in slide-in-from-top-1">{message}</p>
        ) : null}
      </div>
    </div>
  );
}
