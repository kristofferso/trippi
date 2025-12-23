import { createHmac, timingSafeEqual } from "crypto";

export type EmailLinkPayload = {
  memberId: string;
  groupId: string;
  exp: number; // unix seconds
};

function b64urlEncode(input: string | Buffer) {
  return Buffer.from(input)
    .toString("base64")
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

function b64urlDecodeToString(input: string) {
  const b64 = input.replaceAll("-", "+").replaceAll("_", "/");
  const pad = b64.length % 4 === 0 ? "" : "=".repeat(4 - (b64.length % 4));
  return Buffer.from(b64 + pad, "base64").toString("utf8");
}

function getEmailLinkSecret() {
  const secret = process.env.EMAIL_LINK_SECRET;
  if (!secret) throw new Error("EMAIL_LINK_SECRET is not set");
  return secret;
}

function sign(data: string) {
  return createHmac("sha256", getEmailLinkSecret()).update(data).digest();
}

export function createEmailLinkToken(
  payload: Omit<EmailLinkPayload, "exp"> & { exp?: number },
  ttlDays = 60
) {
  const exp =
    payload.exp ?? Math.floor(Date.now() / 1000) + ttlDays * 24 * 60 * 60;
  const full: EmailLinkPayload = { memberId: payload.memberId, groupId: payload.groupId, exp };
  const payloadB64 = b64urlEncode(JSON.stringify(full));
  const sig = sign(payloadB64);
  const sigB64 = b64urlEncode(sig);
  return `${payloadB64}.${sigB64}`;
}

export function verifyEmailLinkToken(token: string): EmailLinkPayload | null {
  const [payloadB64, sigB64] = token.split(".");
  if (!payloadB64 || !sigB64) return null;

  let payloadStr: string;
  try {
    payloadStr = b64urlDecodeToString(payloadB64);
  } catch {
    return null;
  }

  let payload: EmailLinkPayload;
  try {
    payload = JSON.parse(payloadStr);
  } catch {
    return null;
  }

  if (!payload?.memberId || typeof payload.memberId !== "string") return null;
  if (!payload?.groupId || typeof payload.groupId !== "string") return null;
  if (!payload?.exp || typeof payload.exp !== "number") return null;
  if (payload.exp < Math.floor(Date.now() / 1000)) return null;

  const expected = sign(payloadB64);
  let actual: Buffer;
  try {
    actual = Buffer.from(
      sigB64.replaceAll("-", "+").replaceAll("_", "/") +
        "=".repeat((4 - (sigB64.length % 4)) % 4),
      "base64"
    );
  } catch {
    return null;
  }

  if (actual.length !== expected.length) return null;
  if (!timingSafeEqual(actual, expected)) return null;

  return payload;
}


