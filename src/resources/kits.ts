import { RallyaClient } from "../client.js";
import type { KitCollection, KitCollectionFilter, KitType } from "../types.js";

export class KitsResource {
  constructor(private readonly client: RallyaClient) {}

  /** Define a named kit type for an event (quantityTotal >= 1). */
  create(
    orgIdOrSlug: string,
    eventIdOrSlug: string,
    input: { name: string; description?: string; quantityTotal: number },
  ): Promise<KitType> {
    return this.client.request<KitType>(
      `orgs/${RallyaClient.seg(orgIdOrSlug)}/events/${RallyaClient.seg(eventIdOrSlug)}/kits`,
      { method: "POST", body: input },
    );
  }

  /** List kit types with live pending/collected/voided/remaining tallies. */
  list(orgIdOrSlug: string, eventIdOrSlug: string): Promise<KitType[]> {
    return this.client.request<KitType[]>(
      `orgs/${RallyaClient.seg(orgIdOrSlug)}/events/${RallyaClient.seg(eventIdOrSlug)}/kits`,
      { method: "GET" },
    );
  }

  update(
    orgIdOrSlug: string,
    eventIdOrSlug: string,
    kitId: string,
    input: { name?: string; description?: string; quantityTotal?: number },
  ): Promise<KitType> {
    return this.client.request<KitType>(
      `orgs/${RallyaClient.seg(orgIdOrSlug)}/events/${RallyaClient.seg(eventIdOrSlug)}/kits/${RallyaClient.seg(kitId)}`,
      { method: "PATCH", body: input },
    );
  }

  remove(orgIdOrSlug: string, eventIdOrSlug: string, kitId: string): Promise<void> {
    return this.client.request<void>(
      `orgs/${RallyaClient.seg(orgIdOrSlug)}/events/${RallyaClient.seg(eventIdOrSlug)}/kits/${RallyaClient.seg(kitId)}`,
      { method: "DELETE" },
    );
  }

  /**
   * Hand a kit to a checked-in attendee. Collects immediately unless
   * `reserve` holds a PENDING unit. Attendee must be CHECKED_IN (422
   * otherwise). Pass `idempotencyKey` to make tablet retries safe.
   */
  collect(
    orgIdOrSlug: string,
    eventIdOrSlug: string,
    kitId: string,
    input: { attendeeId: string; reserve?: boolean; idempotencyKey?: string },
  ): Promise<KitCollection> {
    return this.client.request<KitCollection>(
      `orgs/${RallyaClient.seg(orgIdOrSlug)}/events/${RallyaClient.seg(eventIdOrSlug)}/kits/${RallyaClient.seg(kitId)}/collect`,
      { method: "POST", body: input },
    );
  }

  /** Mark a reserved (PENDING) handout collected. */
  markCollected(orgIdOrSlug: string, eventIdOrSlug: string, collectionId: string): Promise<KitCollection> {
    return this.client.request<KitCollection>(
      `orgs/${RallyaClient.seg(orgIdOrSlug)}/events/${RallyaClient.seg(eventIdOrSlug)}/kit-collections/${RallyaClient.seg(collectionId)}/collect`,
      { method: "POST" },
    );
  }

  /** Void a PENDING or COLLECTED handout (frees re-issue). */
  void(orgIdOrSlug: string, eventIdOrSlug: string, collectionId: string): Promise<KitCollection> {
    return this.client.request<KitCollection>(
      `orgs/${RallyaClient.seg(orgIdOrSlug)}/events/${RallyaClient.seg(eventIdOrSlug)}/kit-collections/${RallyaClient.seg(collectionId)}/void`,
      { method: "POST" },
    );
  }

  /** List handouts, filterable by kitId / status / attendeeId. */
  listCollections(
    orgIdOrSlug: string,
    eventIdOrSlug: string,
    filter?: KitCollectionFilter,
  ): Promise<{ items: KitCollection[]; total: number }> {
    return this.client.request(
      `orgs/${RallyaClient.seg(orgIdOrSlug)}/events/${RallyaClient.seg(eventIdOrSlug)}/kit-collections`,
      { method: "GET", query: filter as Record<string, string | number | undefined> },
    );
  }

  /** List handouts for one kit, with optional ?status= filter. */
  listKitCollections(
    orgIdOrSlug: string,
    eventIdOrSlug: string,
    kitId: string,
    filter?: { status?: string },
  ): Promise<{ items: KitCollection[]; total: number }> {
    return this.client.request(
      `orgs/${RallyaClient.seg(orgIdOrSlug)}/events/${RallyaClient.seg(eventIdOrSlug)}/kits/${RallyaClient.seg(kitId)}/collections`,
      { method: "GET", query: filter as Record<string, string | number | undefined> },
    );
  }
}
