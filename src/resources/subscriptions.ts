import { RallyaClient } from "../client.js";
import type { Subscription, SubscriptionTier } from "../types.js";

export class SubscriptionsResource {
  constructor(private readonly client: RallyaClient) {}

  /** Public catalog: three tiers with limits, features, and prices. */
  listPlans(): Promise<SubscriptionTier[]> {
    return this.client.request<SubscriptionTier[]>("subscription/plans", {
      method: "GET",
      auth: false,
    });
  }

  /** Org billing state. Absent subscription reads FREE. */
  get(orgIdOrSlug: string): Promise<Subscription> {
    return this.client.request<Subscription>(
      `orgs/${RallyaClient.seg(orgIdOrSlug)}/subscription`,
      { method: "GET" },
    );
  }

  /**
   * Start a Stripe subscription-mode Checkout for PRO/SCALE (OWNER).
   * Returns the hosted redirect URL — fulfillment lands via webhook.
   * 503 when billing is unconfigured server-side.
   */
  checkout(orgIdOrSlug: string, plan: "PRO" | "SCALE"): Promise<{ url: string; sessionId: string }> {
    return this.client.request(
      `orgs/${RallyaClient.seg(orgIdOrSlug)}/subscription/checkout`,
      { method: "POST", body: { plan } },
    );
  }

  /**
   * Open the Stripe Customer Portal for self-serve manage/cancel
   * (OWNER). Downgrades land at period end.
   */
  portal(orgIdOrSlug: string): Promise<{ url: string }> {
    return this.client.request(
      `orgs/${RallyaClient.seg(orgIdOrSlug)}/subscription/portal`,
      { method: "POST" },
    );
  }
}
