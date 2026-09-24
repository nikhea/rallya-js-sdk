import { describe, expect, it } from "vitest";
import { createHmac } from "node:crypto";
import { verifyStripeWebhookSignature } from "../src/node/webhooks.js";

describe("verifyStripeWebhookSignature", () => {
  it("verifies a well-formed signature within tolerance", () => {
    const secret = "whsec_test";
    const rawBody = JSON.stringify({ id: "evt_1" });
    const ts = Math.floor(Date.now() / 1000);
    const sig = createHmac("sha256", secret).update(`${ts}.${rawBody}`).digest("hex");
    const res = verifyStripeWebhookSignature({
      rawBody,
      signatureHeader: `t=${ts},v1=${sig}`,
      webhookSecret: secret,
    });
    expect(res).toEqual({ verified: true, eventId: "evt_1" });
  });

  it("rejects tampered signatures", () => {
    const res = verifyStripeWebhookSignature({
      rawBody: "{}",
      signatureHeader: "t=123,v1=deadbeef",
      webhookSecret: "whsec_test",
    });
    expect(res.verified).toBe(false);
  });
});
