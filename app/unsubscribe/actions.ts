"use server";

import { eq } from "drizzle-orm";

import { db } from "@/db";
import { groupMembers } from "@/db/schema";
import { verifyEmailLinkToken } from "@/lib/email-link-token";
import { createMemberSession } from "@/lib/session";

function safeRedirectPath(path: string | null | undefined) {
  if (!path) return null;
  if (!path.startsWith("/")) return null;
  if (path.startsWith("//")) return null;
  return path;
}

export async function unsubscribeAction(input: {
  token: string;
  redirect?: string | null;
}) {
  const payload = verifyEmailLinkToken(input.token);
  if (!payload)
    return { ok: false as const, error: "Invalid or expired link." };

  await db
    .update(groupMembers)
    .set({
      emailNotificationsEnabled: false,
      emailUnsubscribedAt: new Date(),
    })
    .where(eq(groupMembers.id, payload.memberId));

  // Log them in for this group so "Continue" doesn't require any extra steps.
  await createMemberSession(payload.groupId, payload.memberId);

  return { ok: true as const, redirect: safeRedirectPath(input.redirect) };
}
