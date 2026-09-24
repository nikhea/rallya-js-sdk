import { RallyaClient } from "../client.js";
import type { Attendee, Page, PageQuery } from "../types.js";

export class AttendeesResource {
  constructor(private readonly client: RallyaClient) {}

  listMine(q?: PageQuery): Promise<Page<Attendee>> {
    return this.client.request<Page<Attendee>>("attendees/mine", {
      method: "GET",
      query: q as Record<string, string | number | undefined>,
    });
  }

  getMine(attendeeId: string): Promise<Attendee> {
    return this.client.request<Attendee>(`attendees/${RallyaClient.seg(attendeeId)}`, { method: "GET" });
  }

  cancelMine(attendeeId: string): Promise<Attendee> {
    return this.client.request<Attendee>(`attendees/${RallyaClient.seg(attendeeId)}/cancel`, {
      method: "POST",
    });
  }

  listRoster(orgIdOrSlug: string, eventIdOrSlug: string, q?: PageQuery): Promise<Page<Attendee>> {
    return this.client.request<Page<Attendee>>(
      `orgs/${RallyaClient.seg(orgIdOrSlug)}/events/${RallyaClient.seg(eventIdOrSlug)}/attendees`,
      { method: "GET", query: q as Record<string, string | number | undefined> },
    );
  }

  addWalkIn(
    orgIdOrSlug: string,
    eventIdOrSlug: string,
    input: { email: string; name?: string },
  ): Promise<Attendee> {
    return this.client.request<Attendee>(
      `orgs/${RallyaClient.seg(orgIdOrSlug)}/events/${RallyaClient.seg(eventIdOrSlug)}/attendees`,
      { method: "POST", body: input },
    );
  }

  correct(
    orgIdOrSlug: string,
    eventIdOrSlug: string,
    attendeeId: string,
    input: { name?: string; email?: string },
  ): Promise<Attendee> {
    return this.client.request<Attendee>(
      `orgs/${RallyaClient.seg(orgIdOrSlug)}/events/${RallyaClient.seg(eventIdOrSlug)}/attendees/${RallyaClient.seg(attendeeId)}`,
      { method: "PATCH", body: input },
    );
  }
}
