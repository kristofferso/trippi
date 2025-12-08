import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { groupMembers } from "@/db/schema";
import { getCurrentMember, getMemberSession } from "@/lib/session";

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        // Retrieve groupId from request URL or body?
        // handleUpload doesn't easily expose custom params in the initial request to POST
        // But the client-side `upload` function can pass query params to the `handleUploadUrl`
        // However, the standard `handleUpload` signature expects `body` and `request`.
        // We can parse the referer or use a query param if we update the client call.

        // Alternatively, if we only have one group context per user session, `getMemberSession` works.
        // But for admins with multiple groups, we need to know WHICH group they are uploading for.
        // The `upload` call in client does not send groupId by default.

        // Strategy:
        // 1. Check if the user is an admin of ANY group? No, too broad.
        // 2. We need the groupId.
        // Let's inspect the request url for a search param `groupId`.

        const url = new URL(request.url);
        const groupId = url.searchParams.get("groupId");

        let member = null;

        if (groupId) {
          member = await getCurrentMember(groupId);
        } else {
          // Fallback to old behavior: check cookie based session (only works for guest sessions usually)
          const session = await getMemberSession();
          if (session?.memberId) {
            member = await db.query.groupMembers.findFirst({
              where: eq(groupMembers.id, session.memberId),
            });
          }
        }

        if (!member) {
          throw new Error("Not signed in");
        }

        if (!member.isAdmin) {
          throw new Error("Admins only");
        }

        return {
          allowedContentTypes: [
            "video/mp4",
            "video/quicktime",
            "video/webm",
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/gif",
          ],
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({
            memberId: member.id,
          }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        console.log("blob upload completed", blob, tokenPayload);
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 } // handleUpload client expects error message
    );
  }
}
