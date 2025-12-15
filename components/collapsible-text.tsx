"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  text: string;
  className?: string;
  fadeClassName?: string;
  collapsedLines?: number;
  buttonVariant?: "ghost" | "secondary";
};

export function CollapsibleText({
  text,
  className,
  fadeClassName,
  collapsedLines = 6,
  buttonVariant = "ghost",
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const shouldCollapse = useMemo(() => text.trim().length > 220, [text]);

  return (
    <div className="relative space-y-2">
      <p
        className={cn(
          "transition-all duration-300 ease-in-out text-[15px] leading-relaxed",
          !expanded && "line-clamp-6",
          className
        )}
        style={!expanded ? { WebkitLineClamp: collapsedLines } : undefined}
      >
        {text}
      </p>
      {!expanded && shouldCollapse ? (
        <div
          className={cn(
            "pointer-events-none absolute inset-x-0 bottom-8 h-16 bg-gradient-to-t from-black/70 via-black/20 to-transparent",
            fadeClassName
          )}
        />
      ) : null}
      {shouldCollapse ? (
        <Button
          type="button"
          variant={buttonVariant}
          size="sm"
          className="px-3 py-2 text-sm h-9 rounded-full active:scale-[0.98]"
          onClick={() => setExpanded((prev) => !prev)}
        >
          {expanded ? "Show less" : "Show more"}
        </Button>
      ) : null}
    </div>
  );
}
