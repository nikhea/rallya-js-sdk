import { RallyaClient } from "../client.js";
import type { CreateTicketInput, TicketType, UpdateTicketInput } from "../types.js";

export class TicketsResource {
  constructor(private readonly client: RallyaClient) {}

  listPublic(eventIdOrSlug: string): Promise<TicketType[]> {
    return this.client.request<TicketType[]>(`events/${RallyaClient.seg(eventIdOrSlug)}/tickets`, {
      method: "GET",
      auth: false,
    });
  }

  list(orgIdOrSlug: string, eventIdOrSlug: string): Promise<TicketType[]> {
    return this.client.request<TicketType[]>(
      `orgs/${RallyaClient.seg(orgIdOrSlug)}/events/${RallyaClient.seg(eventIdOrSlug)}/tickets`,
      { method: "GET" },
    );
  }

  create(orgIdOrSlug: string, eventIdOrSlug: string, input: CreateTicketInput): Promise<TicketType> {
    return this.client.request<TicketType>(
      `orgs/${RallyaClient.seg(orgIdOrSlug)}/events/${RallyaClient.seg(eventIdOrSlug)}/tickets`,
      { method: "POST", body: input },
    );
  }

  get(orgIdOrSlug: string, eventIdOrSlug: string, ticketId: string): Promise<TicketType> {
    return this.client.request<TicketType>(
      `orgs/${RallyaClient.seg(orgIdOrSlug)}/events/${RallyaClient.seg(eventIdOrSlug)}/tickets/${RallyaClient.seg(ticketId)}`,
      { method: "GET" },
    );
  }

  update(
    orgIdOrSlug: string,
    eventIdOrSlug: string,
    ticketId: string,
    input: UpdateTicketInput,
  ): Promise<TicketType> {
    return this.client.request<TicketType>(
      `orgs/${RallyaClient.seg(orgIdOrSlug)}/events/${RallyaClient.seg(eventIdOrSlug)}/tickets/${RallyaClient.seg(ticketId)}`,
      { method: "PATCH", body: input },
    );
  }

  remove(orgIdOrSlug: string, eventIdOrSlug: string, ticketId: string): Promise<void> {
    return this.client.request<void>(
      `orgs/${RallyaClient.seg(orgIdOrSlug)}/events/${RallyaClient.seg(eventIdOrSlug)}/tickets/${RallyaClient.seg(ticketId)}`,
      { method: "DELETE" },
    );
  }

  activate(orgIdOrSlug: string, eventIdOrSlug: string, ticketId: string): Promise<TicketType> {
    return this.client.request<TicketType>(
      `orgs/${RallyaClient.seg(orgIdOrSlug)}/events/${RallyaClient.seg(eventIdOrSlug)}/tickets/${RallyaClient.seg(ticketId)}/activate`,
      { method: "POST" },
    );
  }

  pause(orgIdOrSlug: string, eventIdOrSlug: string, ticketId: string): Promise<TicketType> {
    return this.client.request<TicketType>(
      `orgs/${RallyaClient.seg(orgIdOrSlug)}/events/${RallyaClient.seg(eventIdOrSlug)}/tickets/${RallyaClient.seg(ticketId)}/pause`,
      { method: "POST" },
    );
  }
}
