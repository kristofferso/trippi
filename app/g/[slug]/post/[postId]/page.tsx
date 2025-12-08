import { notFound } from "next/navigation";
import { count, desc, eq } from "drizzle-orm";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { PasswordGate } from "@/components/password-gate";
import { NameDialog } from "@/components/name-dialog";
import { PostInteractionLayer } from "@/components/post-interaction-layer";
import { VideoPlayer } from "@/components/video-player";
import { db } from "@/db";
import { comments, groupMembers, groups, posts, reactions } from "@/db/schema";
import { getCurrentMember, getMemberSession } from "@/lib/session";
import { formatDate } from "@/lib/utils";

export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string; postId: string }>;
}) {
  const { slug, postId } = await params;
  const group = await db.query.groups.findFirst({
    where: eq(groups.slug, slug),
  });
  if (!group) notFound();

  const member = await getCurrentMember(group.id);
  const session = await getMemberSession(group.id);

  if (group.passwordHash && !member && !session) {
    return <PasswordGate slug={group.slug} name={group.name} />;
  }

  const post = await db.query.posts.findFirst({ where: eq(posts.id, postId) });
  if (!post || post.groupId !== group.id) notFound();

  const isAdmin = !!member?.isAdmin;

  // Normalize media items
  // If we have the new `media` JSON, use it.
  // Fallback to legacy `videoUrl` and `imageUrls` columns if `media` is empty.
  // This ensures backward compatibility until all data is migrated.
  let mediaItems: { type: "image" | "video"; url: string }[] =
    post.media && post.media.length > 0 ? post.media : [];

  if (mediaItems.length === 0) {
    if (post.videoUrl) {
      mediaItems.push({ type: "video", url: post.videoUrl });
    }
    if (post.imageUrls && post.imageUrls.length > 0) {
      mediaItems.push(
        ...post.imageUrls.map((url) => ({ type: "image" as const, url }))
      );
    }
  }

  // Fetch reactions
  const reactionRows = await db
    .select({ emoji: reactions.emoji, count: count() })
    .from(reactions)
    .where(eq(reactions.postId, post.id))
    .groupBy(reactions.emoji);
  const reactionCounts: Record<string, number> = {};
  for (const row of reactionRows) {
    reactionCounts[row.emoji] = Number(row.count);
  }

  // Fetch comments
  const commentRows = await db
    .select({
      id: comments.id,
      text: comments.text,
      createdAt: comments.createdAt,
      memberId: comments.memberId,
      parentId: comments.parentId,
      displayName: groupMembers.displayName,
    })
    .from(comments)
    .innerJoin(groupMembers, eq(comments.memberId, groupMembers.id))
    .where(eq(comments.postId, post.id))
    .orderBy(desc(comments.createdAt));

  const commentsWithAuthors = commentRows.map((comment) => ({
    id: comment.id,
    text: comment.text,
    createdAt: comment.createdAt,
    parentId: comment.parentId,
    member: {
      id: comment.memberId,
      displayName: comment.displayName,
    },
  }));

  return (
    <div className="relative h-[100dvh] w-full bg-black overflow-hidden">
      {/* Top Navigation */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-4 bg-gradient-to-b from-black/60 to-transparent pt-6">
        <Link
          href={`/g/${slug}`}
          className="flex items-center gap-2 text-white/90 hover:text-white transition-colors"
        >
          <ChevronLeft className="h-8 w-8 drop-shadow-md" />
          <span className="sr-only">Back to Feed</span>
        </Link>
        <div className="font-semibold text-white drop-shadow-md">
          {group.name}
        </div>
        <div className="w-8" /> {/* Spacer for centering */}
      </div>

      {/* Main Content Layer */}
      <div className="absolute inset-0 z-0 flex items-center justify-center bg-black">
        {mediaItems.length > 0 ? (
          <Carousel className="h-full w-full [&_[data-slot=carousel-content]]:h-full">
            <CarouselContent className="h-full">
              {mediaItems.map((item, index) => (
                <CarouselItem
                  key={index}
                  className="h-full flex items-center justify-center bg-black"
                >
                  <div className="relative h-full w-full flex items-center justify-center">
                    {item.type === "video" ? (
                      <VideoPlayer
                        src={item.url}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Image
                        src={item.url}
                        alt={`Media ${index + 1}`}
                        fill
                        className="object-contain"
                        priority={index === 0}
                      />
                    )}
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            {mediaItems.length > 1 && (
              <>
                <CarouselPrevious className="left-2 bg-black/20 border-none text-white hover:bg-black/40" />
                <CarouselNext className="right-2 bg-black/20 border-none text-white hover:bg-black/40" />
              </>
            )}
          </Carousel>
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 p-8">
            <div className="max-w-2xl text-center">
              <h1 className="text-3xl font-bold text-white mb-6 md:text-5xl leading-tight">
                {post.title}
              </h1>
              {post.body && (
                <div className="prose prose-invert prose-lg max-w-none text-slate-200">
                  <p>{post.body}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Interaction Layer (Overlay Info + Actions) */}
      <PostInteractionLayer
        postId={post.id}
        post={post}
        counts={reactionCounts}
        comments={commentsWithAuthors}
        isAdmin={isAdmin}
      />

      <NameDialog groupId={group.id} />
    </div>
  );
}
