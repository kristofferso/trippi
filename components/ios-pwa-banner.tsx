"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const DISMISS_KEY = "trippi-ios-a2hs-dismissed";

export function IosPwaBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent || "";
    const isIOS = /iPad|iPhone|iPod/.test(ua);
    const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua);
    const isStandalone =
      (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) ||
      (navigator as any).standalone;
    const dismissed = localStorage.getItem(DISMISS_KEY) === "1";

    if (isIOS && isSafari && !isStandalone && !dismissed) {
      setVisible(true);
    }
  }, []);

  if (!visible) return null;

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, "1");
    setVisible(false);
  };

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-50 px-4">
      <div
        className={cn(
          "pointer-events-auto mx-auto flex max-w-md flex-col gap-3 rounded-2xl bg-white/95 p-4 text-slate-900 shadow-2xl ring-1 ring-slate-200 backdrop-blur",
          "border border-white/60"
        )}
        style={{ paddingBottom: `calc(env(safe-area-inset-bottom) + 12px)` }}
      >
        <div className="flex items-start gap-3">
          <div className="flex-1 space-y-1">
            <p className="text-sm font-semibold">Add to Home Screen</p>
            <p className="text-xs text-slate-600">
              Open Share → Add to Home Screen to launch Trippi like a native app.
            </p>
          </div>
          <Button
            size="icon"
            variant="ghost"
            onClick={handleDismiss}
            className="h-11 w-11 rounded-full active:scale-95"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Dismiss</span>
          </Button>
        </div>
        <ol className="list-decimal space-y-1 pl-5 text-xs text-slate-700">
          <li>Tap the Share icon in Safari.</li>
          <li>Select “Add to Home Screen”.</li>
          <li>Confirm to open Trippi in full screen.</li>
        </ol>
      </div>
    </div>
  );
}
