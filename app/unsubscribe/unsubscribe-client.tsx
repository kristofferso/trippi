"use client";

import { useEffect, useState, useTransition } from "react";
import { unsubscribeAction } from "./page";

type Props = {
  token: string | null | undefined;
  redirect?: string | null | undefined;
};

export function UnsubscribeClient({ token, redirect }: Props) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<
    { ok: true; redirect: string | null } | { ok: false; error: string } | null
  >(null);

  useEffect(() => {
    if (!token) {
      setResult({ ok: false, error: "Missing token." });
      return;
    }

    startTransition(async () => {
      const res = await unsubscribeAction({
        token,
        redirect: redirect ?? null,
      });
      setResult(res as any);
    });
  }, [token, redirect, startTransition]);

  if (!result) {
    return (
      <div style={{ padding: 24, maxWidth: 560, margin: "0 auto" }}>
        <h1 style={{ fontSize: 18, margin: "0 0 12px" }}>Unsubscribing…</h1>
        <p style={{ margin: 0, color: "#444", lineHeight: 1.5 }}>
          Please wait.
        </p>
      </div>
    );
  }

  if (!result.ok) {
    return (
      <div style={{ padding: 24, maxWidth: 560, margin: "0 auto" }}>
        <h1 style={{ fontSize: 18, margin: "0 0 12px" }}>
          Couldn’t unsubscribe
        </h1>
        <p style={{ margin: 0, color: "#444", lineHeight: 1.5 }}>
          {result.error}
        </p>
      </div>
    );
  }

  return (
    <div style={{ padding: 24, maxWidth: 560, margin: "0 auto" }}>
      <h1 style={{ fontSize: 18, margin: "0 0 12px" }}>You’re unsubscribed</h1>
      <p style={{ margin: "0 0 14px", color: "#444", lineHeight: 1.5 }}>
        You will no longer receive daily email notifications for new posts in
        this group.
      </p>
      {result.redirect ? (
        <a
          href={result.redirect}
          style={{ color: "#2563eb", textDecoration: "none" }}
        >
          Continue →
        </a>
      ) : null}
      {pending ? (
        <div style={{ marginTop: 10, fontSize: 12, color: "#666" }}>
          Working…
        </div>
      ) : null}
    </div>
  );
}
