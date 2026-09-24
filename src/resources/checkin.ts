import { RallyaClient } from "../client.js";
import type { CheckinStats, ScanResult } from "../types.js";

export class CheckinResource {
  constructor(private readonly client: RallyaClient) {}

  /** Door scan: exactly one of code / attendeeId. Refusals are 200 + outcome, never errors. */
  scan(
    orgIdOrSlug: string,
    eventIdOrSlug: string,
    input: { code?: string; attendeeId?: string },
  ): Promise<ScanResult> {
    return this.client.request<ScanResult>(
      `orgs/${RallyaClient.seg(orgIdOrSlug)}/events/${RallyaClient.seg(eventIdOrSlug)}/checkin`,
      { method: "POST", body: input },
    );
  }

  scanBatch(orgIdOrSlug: string, eventIdOrSlug: string, codes: string[]): Promise<{ results: ScanResult[] }> {
    if (codes.length > 50) throw new Error("batch check-in limited to 50 codes");
    return this.client.request<{ results: ScanResult[] }>(
      `orgs/${RallyaClient.seg(orgIdOrSlug)}/events/${RallyaClient.seg(eventIdOrSlug)}/checkin/batch`,
      { method: "POST", body: { codes } },
    );
  }

  revert(orgIdOrSlug: string, eventIdOrSlug: string, attendeeId: string): Promise<ScanResult> {
    return this.client.request<ScanResult>(
      `orgs/${RallyaClient.seg(orgIdOrSlug)}/events/${RallyaClient.seg(eventIdOrSlug)}/checkin/revert`,
      { method: "POST", body: { attendeeId } },
    );
  }

  stats(orgIdOrSlug: string, eventIdOrSlug: string): Promise<CheckinStats> {
    return this.client.request<CheckinStats>(
      `orgs/${RallyaClient.seg(orgIdOrSlug)}/events/${RallyaClient.seg(eventIdOrSlug)}/checkin/stats`,
      { method: "GET" },
    );
  }
}
