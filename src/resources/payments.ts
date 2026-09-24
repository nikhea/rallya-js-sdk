import { RallyaClient } from "../client.js";
import type { CheckoutResponse } from "../types.js";

export class PaymentsResource {
  constructor(private readonly client: RallyaClient) {}

  /**
   * Create a Stripe Checkout Session for a priced order.
   * Returns the redirect URL — complete payment in the browser.
   * 503 when Stripe is unconfigured server-side.
   */
  checkout(orderId: string): Promise<CheckoutResponse> {
    return this.client.request<CheckoutResponse>(`orders/${RallyaClient.seg(orderId)}/checkout`, {
      method: "POST",
    });
  }
}
