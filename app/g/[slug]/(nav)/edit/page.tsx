import { notFound, redirect } from "next/navigation";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { groups, groupMembers } from "@/db/schema";
import { getCurrentMember } from "@/lib/session";
import { EditTripContent } from "@/components/edit-trip-content";
import { getGroupMembers } from "@/app/actions";

export default async function EditTripPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const group = await db.query.groups.findFirst({
    where: eq(groups.slug, slug),
  });

  if (!group) notFound();

  const member = await getCurrentMember(group.id);
  
  if (!member || !member.isAdmin) {
    redirect(`/g/${slug}`);
  }

  const members = await getGroupMembers(group.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Edit Trip</h1>
      </div>
      <EditTripContent group={group} initialMembers={members} />
    </div>
  );
}

