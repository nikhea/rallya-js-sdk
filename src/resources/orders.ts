import { RallyaClient } from "../client.js";
import type { CreateOrderInput, Order, Page, PageQuery } from "../types.js";

function idempotencyKey(): string {
  const c = globalThis.crypto as unknown as { randomUUID?: () => string } | undefined;
  if (c?.randomUUID) return c.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export class OrdersResource {
  constructor(private readonly client: RallyaClient) {}

  create(eventIdOrSlug: string, input: CreateOrderInput): Promise<Order> {
    const body: CreateOrderInput = { ...input, idempotencyKey: input.idempotencyKey ?? idempotencyKey() };
    return this.client.request<Order>(`events/${RallyaClient.seg(eventIdOrSlug)}/orders`, {
      method: "POST",
      body,
    });
  }

  listMine(q?: PageQuery): Promise<Page<Order>> {
    return this.client.request<Page<Order>>("orders/mine", {
      method: "GET",
      query: q as Record<string, string | number | undefined>,
    });
  }

  get(orderId: string): Promise<Order> {
    return this.client.request<Order>(`orders/${RallyaClient.seg(orderId)}`, { method: "GET" });
  }

  cancel(orderId: string): Promise<Order> {
    return this.client.request<Order>(`orders/${RallyaClient.seg(orderId)}/cancel`, { method: "POST" });
  }
}
