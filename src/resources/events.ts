import { RallyaClient } from "../client.js";
import type { CreateEventInput, EventFilter, EventImage, Page, RallyaEvent, UpdateEventInput } from "../types.js";

const MAX_COVER_BYTES = 5 * 1024 * 1024;

function toFormData(field: "cover" | "images", file: File | Blob | Buffer, filename?: string): FormData {
  const size = file instanceof Blob ? file.size : (file as Buffer).length;
  if (size > MAX_COVER_BYTES) {
    throw new Error(`file exceeds 5 MB cover limit (${size} bytes)`);
  }
  const fd = new FormData();
  const part =
    typeof File !== "undefined" && file instanceof Blob
      ? new File([file], filename ?? "upload", { type: (file as Blob).type })
      : new Blob([file as unknown as BlobPart], { type: "application/octet-stream" });
  fd.append(field, part, filename ?? "upload");
  return fd;
}

export class EventsResource {
  constructor(private readonly client: RallyaClient) {}

  /** Public discovery (published only, no auth needed but harmless with it). */
  listPublic(filter?: EventFilter): Promise<Page<RallyaEvent>> {
    return this.client.request<Page<RallyaEvent>>("events", {
      method: "GET",
      query: filter as Record<string, string | number | undefined>,
      auth: false,
    });
  }

  getPublic(idOrSlug: string): Promise<RallyaEvent> {
    return this.client.request<RallyaEvent>(`events/${RallyaClient.seg(idOrSlug)}`, {
      method: "GET",
      auth: false,
    });
  }

  listOrg(orgIdOrSlug: string, q?: EventFilter): Promise<Page<RallyaEvent>> {
    return this.client.request<Page<RallyaEvent>>(`orgs/${RallyaClient.seg(orgIdOrSlug)}/events`, {
      method: "GET",
      query: q as Record<string, string | number | undefined>,
    });
  }

  create(orgIdOrSlug: string, input: CreateEventInput): Promise<RallyaEvent> {
    return this.client.request<RallyaEvent>(`orgs/${RallyaClient.seg(orgIdOrSlug)}/events`, {
      method: "POST",
      body: input,
    });
  }

  get(orgIdOrSlug: string, eventIdOrSlug: string): Promise<RallyaEvent> {
    return this.client.request<RallyaEvent>(
      `orgs/${RallyaClient.seg(orgIdOrSlug)}/events/${RallyaClient.seg(eventIdOrSlug)}`,
      { method: "GET" },
    );
  }

  update(orgIdOrSlug: string, eventIdOrSlug: string, input: UpdateEventInput): Promise<RallyaEvent> {
    return this.client.request<RallyaEvent>(
      `orgs/${RallyaClient.seg(orgIdOrSlug)}/events/${RallyaClient.seg(eventIdOrSlug)}`,
      { method: "PATCH", body: input },
    );
  }

  remove(orgIdOrSlug: string, eventIdOrSlug: string): Promise<void> {
    return this.client.request<void>(
      `orgs/${RallyaClient.seg(orgIdOrSlug)}/events/${RallyaClient.seg(eventIdOrSlug)}`,
      { method: "DELETE" },
    );
  }

  publish(orgIdOrSlug: string, eventIdOrSlug: string): Promise<RallyaEvent> {
    return this.client.request<RallyaEvent>(
      `orgs/${RallyaClient.seg(orgIdOrSlug)}/events/${RallyaClient.seg(eventIdOrSlug)}/publish`,
      { method: "POST" },
    );
  }

  unpublish(orgIdOrSlug: string, eventIdOrSlug: string): Promise<RallyaEvent> {
    return this.client.request<RallyaEvent>(
      `orgs/${RallyaClient.seg(orgIdOrSlug)}/events/${RallyaClient.seg(eventIdOrSlug)}/unpublish`,
      { method: "POST" },
    );
  }

  cancel(orgIdOrSlug: string, eventIdOrSlug: string): Promise<RallyaEvent> {
    return this.client.request<RallyaEvent>(
      `orgs/${RallyaClient.seg(orgIdOrSlug)}/events/${RallyaClient.seg(eventIdOrSlug)}/cancel`,
      { method: "POST" },
    );
  }

  async uploadCover(
    orgIdOrSlug: string,
    eventIdOrSlug: string,
    file: File | Blob | Buffer,
    filename?: string,
  ): Promise<RallyaEvent> {
    return this.client.request<RallyaEvent>(
      `orgs/${RallyaClient.seg(orgIdOrSlug)}/events/${RallyaClient.seg(eventIdOrSlug)}/cover`,
      { method: "POST", formData: toFormData("cover", file, filename) },
    );
  }

  async uploadImages(
    orgIdOrSlug: string,
    eventIdOrSlug: string,
    file: File | Blob | Buffer,
    filename?: string,
  ): Promise<EventImage> {
    return this.client.request<EventImage>(
      `orgs/${RallyaClient.seg(orgIdOrSlug)}/events/${RallyaClient.seg(eventIdOrSlug)}/images`,
      { method: "POST", formData: toFormData("images", file, filename) },
    );
  }

  listImages(orgIdOrSlug: string, eventIdOrSlug: string): Promise<Page<EventImage>> {
    return this.client.request<Page<EventImage>>(
      `orgs/${RallyaClient.seg(orgIdOrSlug)}/events/${RallyaClient.seg(eventIdOrSlug)}/images`,
      { method: "GET" },
    );
  }
}
