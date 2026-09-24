import { RallyaClient } from "../client.js";
import type { AuditEvent, Page, PageQuery, PolicyDiff } from "../types.js";

export interface AuditQuery extends PageQuery {
  action?: string;
  objectType?: string;
  objectId?: string;
  actor?: string;
  org?: string;
  since?: string;
  until?: string;
}

export class AuditResource {
  constructor(private readonly client: RallyaClient) {}

  listOrg(orgIdOrSlug: string, q?: AuditQuery): Promise<Page<AuditEvent>> {
    return this.client.request<Page<AuditEvent>>(`orgs/${RallyaClient.seg(orgIdOrSlug)}/audit`, {
      method: "GET",
      query: q as Record<string, string | number | undefined>,
    });
  }

  listPlatform(q?: AuditQuery): Promise<Page<AuditEvent>> {
    return this.client.request<Page<AuditEvent>>("admin/audit", {
      method: "GET",
      query: q as Record<string, string | number | undefined>,
    });
  }
}

export class AdminResource {
  constructor(private readonly client: RallyaClient) {}

  listOrgs(q?: PageQuery): Promise<Page<{ id: string; name: string; slug: string; members: number; createdAt: string }>> {
    return this.client.request("admin/orgs", {
      method: "GET",
      query: q as Record<string, string | number | undefined>,
    });
  }

  getOrg(id: string): Promise<unknown> {
    return this.client.request(`admin/orgs/${RallyaClient.seg(id)}`, { method: "GET" });
  }

  reseedOrgPolicies(id: string): Promise<PolicyDiff> {
    return this.client.request<PolicyDiff>(`admin/orgs/${RallyaClient.seg(id)}/policies/reseed`, {
      method: "POST",
    });
  }

  searchUsers(q?: PageQuery & { q?: string }): Promise<Page<unknown>> {
    return this.client.request("admin/users", {
      method: "GET",
      query: q as Record<string, string | number | undefined>,
    });
  }

  getUser(id: string): Promise<unknown> {
    return this.client.request(`admin/users/${RallyaClient.seg(id)}`, { method: "GET" });
  }

  listUserOrders(id: string, q?: PageQuery): Promise<Page<unknown>> {
    return this.client.request(`admin/users/${RallyaClient.seg(id)}/orders`, {
      method: "GET",
      query: q as Record<string, string | number | undefined>,
    });
  }

  syncUserPolicies(id: string): Promise<PolicyDiff> {
    return this.client.request<PolicyDiff>(`admin/users/${RallyaClient.seg(id)}/policies/sync`, {
      method: "POST",
    });
  }
}

export class HealthResource {
  constructor(private readonly client: RallyaClient) {}

  live(): Promise<{ status: string; app: string }> {
    // /health sits outside /api/v1 — resolve against the origin, no auth.
    const origin = new URL(this.client.baseUrl).origin;
    return this.client.absoluteGet<{ status: string; app: string }>(`${origin}/health`);
  }

  hello(): Promise<unknown> {
    return this.client.request("hello", { method: "GET", auth: false });
  }
}
