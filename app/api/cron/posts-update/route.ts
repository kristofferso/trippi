import { NextResponse } from "next/server";
import { and, eq, gte, isNotNull } from "drizzle-orm";

import { db } from "@/db";
import { groupMembers, groups, posts } from "@/db/schema";
import { resendSendEmail } from "@/lib/resend";
import { renderNewPostsEmail } from "@/lib/email/new-posts-email";

export const runtime = "nodejs";

function isAuthorized(req: Request) {
  // Vercel Cron Jobs include this header.
  // NOTE: This is not a secret, but it's the officially documented way to ensure
  // the request came from Vercel's scheduler in production.
  if (req.headers.get("x-vercel-cron") === "1") return true;

  const secret = process.env.CRON_SECRET;
  // If you don't set a secret, we only allow running in development.
  // In production, always set CRON_SECRET to prevent anyone triggering email sends.
  if (!secret) return process.env.NODE_ENV !== "production";

  const auth = req.headers.get("authorization");
  if (auth === `Bearer ${secret}`) return true;

  const url = new URL(req.url);
  const key = url.searchParams.get("key");
  if (key && key === secret) return true;

  return false;
}

export async function GET(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json(
      { error: "RESEND_API_KEY is not set" },
      { status: 500 }
    );
  }
  if (!process.env.RESEND_FROM) {
    return NextResponse.json({ error: "RESEND_FROM is not set" }, { status: 500 });
  }
  if (!process.env.EMAIL_LINK_SECRET) {
    return NextResponse.json(
      { error: "EMAIL_LINK_SECRET is not set" },
      { status: 500 }
    );
  }

  const now = new Date();
  const since = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
  const url = new URL(req.url);
  const requestedTestTo = url.searchParams.get("testTo");
  const testTo =
    (process.env.NODE_ENV !== "production" &&
      (process.env.EMAIL_TEST_TO || requestedTestTo)) ||
    null;

  // Extra safety: never allow testTo in production (even if provided).
  if (process.env.NODE_ENV === "production" && requestedTestTo) {
    return NextResponse.json(
      { error: "testTo is not allowed in production" },
      { status: 400 }
    );
  }

  const newPosts = await db.query.posts.findMany({
    where: gte(posts.createdAt, since),
    with: {
      author: { columns: { displayName: true } },
      group: { columns: { id: true, name: true, slug: true } },
    },
    orderBy: (p, { desc }) => [desc(p.createdAt)],
  });

  // Group posts by groupId
  const postsByGroup = new Map<
    string,
    {
      group: { id: string; name: string; slug: string };
      posts: typeof newPosts;
    }
  >();

  for (const p of newPosts) {
    const g = p.group;
    if (!g) continue;
    const existing = postsByGroup.get(g.id);
    if (existing) existing.posts.push(p);
    else postsByGroup.set(g.id, { group: g, posts: [p] });
  }

  let groupsWithPosts = 0;
  let totalRecipients = 0;
  let totalEmailsSent = 0;
  const perGroup: Record<string, { posts: number; recipients: number; sent: number }> =
    {};

  for (const [groupId, bundle] of postsByGroup.entries()) {
    groupsWithPosts++;

    // Resolve group slug/name (bundle has it), but ensure group still exists.
    const group = await db.query.groups.findFirst({
      where: eq(groups.id, groupId),
      columns: { id: true, name: true, slug: true },
    });
    if (!group) continue;

    // Safety: In test mode, DO NOT even query real recipients.
    const finalRecipients = testTo
      ? [{ id: "dev-test", displayName: "Dev Test", email: testTo }]
      : await db
          .select({
            id: groupMembers.id,
            displayName: groupMembers.displayName,
            email: groupMembers.email,
          })
          .from(groupMembers)
          .where(
            and(
              eq(groupMembers.groupId, groupId),
              isNotNull(groupMembers.email),
              eq(groupMembers.emailNotificationsEnabled, true)
            )
          );

    totalRecipients += finalRecipients.length;

    let sent = 0;
    for (const r of finalRecipients) {
      const { subject, react } = renderNewPostsEmail({
        group,
        recipient: { id: r.id, displayName: r.displayName },
        posts: bundle.posts,
      });

      await resendSendEmail({
        to: r.email!,
        subject,
        react,
      });
      sent++;
      totalEmailsSent++;
    }

    perGroup[groupId] = {
      posts: bundle.posts.length,
      recipients: finalRecipients.length,
      sent,
    };
  }

  return NextResponse.json({
    ok: true,
    since: since.toISOString(),
    postsFound: newPosts.length,
    groupsWithPosts,
    testTo,
    totalRecipients,
    totalEmailsSent,
    perGroup,
  });
}


