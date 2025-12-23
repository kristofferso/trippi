import { NextResponse } from "next/server";

import { verifyEmailLinkToken } from "@/lib/email-link-token";
import { createMemberSession } from "@/lib/session";

export const runtime = "nodejs";

function safeRedirectPath(path: string | null) {
  if (!path) return "/";
  // Prevent open redirects: only allow relative paths.
  if (!path.startsWith("/")) return "/";
  if (path.startsWith("//")) return "/";
  return path;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  const redirect = safeRedirectPath(url.searchParams.get("redirect"));

  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }

  const payload = verifyEmailLinkToken(token);
  if (!payload) {
    return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 });
  }

  // Create a member session cookie so the user is "logged in" for this group.
  await createMemberSession(payload.groupId, payload.memberId);

  return NextResponse.redirect(new URL(redirect, url.origin), { status: 302 });
}


