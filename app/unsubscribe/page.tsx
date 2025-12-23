"use server";
import { UnsubscribeClient } from "@/app/unsubscribe/unsubscribe-client";

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; redirect?: string }>;
}) {
  const sp = await searchParams;

  return <UnsubscribeClient token={sp.token} redirect={sp.redirect} />;
}
