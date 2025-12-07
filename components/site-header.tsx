"use client";

import { usePathname } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import trippi from "@/public/trippi.png";
import { NewPostDialog } from "@/components/new-post-dialog";
import { MembersDialog } from "@/components/members-dialog";

export function SiteHeader({
  groupName,
  groupSlug,
  isAdmin,
  groupId,
}: {
  groupName?: string;
  groupSlug?: string;
  isAdmin?: boolean;
  groupId?: string;
}) {
  const pathname = usePathname();
  const isPostPage = pathname?.includes("/post/");

  return (
    <div className="sticky top-0 z-50 border-b bg-white/70 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <div className="flex items-center gap-2">
          {groupSlug && isPostPage ? (
            <Link href={`/g/${groupSlug}`}>
              <Button
                variant="ghost"
                size="icon"
                className="-ml-2 h-8 w-8 text-slate-500 hover:text-slate-900"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Back to group</span>
              </Button>
            </Link>
          ) : (
            <Link
              href="/"
              className="flex items-center gap-2 transition-opacity hover:opacity-80"
            >
              <Image src={trippi} alt="" className="size-8" />
              {!groupName && <p className="text-lg font-bold">Trippi</p>}
            </Link>
          )}

          {groupName && (
            <div className="flex items-center gap-2">
              {isPostPage && <div className="h-4 w-px bg-slate-200" />}
              <h1 className="text-sm font-semibold text-slate-900 sm:text-lg">
                {groupName}
              </h1>
            </div>
          )}
        </div>

        {groupId && (
          <div className="flex items-center gap-2">
            <MembersDialog groupId={groupId} isAdmin={!!isAdmin} />
            {isAdmin && <NewPostDialog />}
          </div>
        )}
      </div>
    </div>
  );
}
