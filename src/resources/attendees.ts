import { RallyaClient } from "../client.js";
import type { Attendee, Page, PageQuery } from "../types.js";
import { withPage } from "../types.js";

export class AttendeesResource {
  constructor(private readonly client: RallyaClient) {}

  async listMine(q?: PageQuery): Promise<Page<Attendee>> {
    const page = await this.client.request<Page<Attendee>>("attendees/mine", {
      method: "GET",
      query: q as Record<string, string | number | undefined>,
    });
    return withPage(q, page);
  }

  getMine(attendeeId: string): Promise<Attendee> {
    return this.client.request<Attendee>(`attendees/${RallyaClient.seg(attendeeId)}`, { method: "GET" });
  }

  cancelMine(attendeeId: string): Promise<Attendee> {
    return this.client.request<Attendee>(`attendees/${RallyaClient.seg(attendeeId)}/cancel`, {
      method: "POST",
    });
  }

  async listRoster(orgIdOrSlug: string, eventIdOrSlug: string, q?: PageQuery): Promise<Page<Attendee>> {
    const page = await this.client.request<Page<Attendee>>(
      `orgs/${RallyaClient.seg(orgIdOrSlug)}/events/${RallyaClient.seg(eventIdOrSlug)}/attendees`,
      { method: "GET", query: q as Record<string, string | number | undefined> },
    );
    return withPage(q, page);
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
