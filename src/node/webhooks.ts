import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Verify a Stripe webhook signature over the RAW request body.
 * Node-only: needs STRIPE_WEBHOOKS_SIGNING_SECRET. Import from "@rallya/sdk/node".
 */
export function verifyStripeWebhookSignature(opts: {
  rawBody: string | Buffer;
  signatureHeader: string;
  webhookSecret: string;
  toleranceSecs?: number;
}): { verified: boolean; eventId?: string } {
  const { rawBody, signatureHeader, webhookSecret, toleranceSecs = 300 } = opts;
  const parts = Object.fromEntries(signatureHeader.split(",").map((p) => p.split("=") as [string, string]));
  const timestamp = Number(parts["t"]);
  const expectedSig = parts["v1"];
  if (!Number.isFinite(timestamp) || !expectedSig) return { verified: false };
  const signedPayload = `${timestamp}.${typeof rawBody === "string" ? rawBody : rawBody.toString("utf8")}`;
  const digest = createHmac("sha256", webhookSecret).update(signedPayload).digest("hex");
  let equal = false;
  try {
    equal = timingSafeEqual(Buffer.from(digest), Buffer.from(expectedSig));
  } catch {
    equal = false;
  }
  if (!equal) return { verified: false };
  if (Math.abs(Date.now() / 1000 - timestamp) > toleranceSecs) return { verified: false };
  try {
    const event = JSON.parse(typeof rawBody === "string" ? rawBody : rawBody.toString("utf8")) as { id?: string };
    return { verified: true, eventId: event.id };
  } catch {
    return { verified: true };
  }
}
