import { RallyaClient } from "../client.js";
import type {
  CreateOrgInput,
  CustomRole,
  Org,
  OrgInvite,
  OrgMember,
  Page,
  PageQuery,
  Permission,
  UpdateOrgInput,
} from "../types.js";
import { withPage } from "../types.js";

export class OrgsResource {
  constructor(private readonly client: RallyaClient) {}

  create(input: CreateOrgInput): Promise<Org> {
    return this.client.request<Org>("orgs", { method: "POST", body: input });
  }

  listMine(): Promise<Org[]> {
    return this.client.request<Org[]>("orgs", { method: "GET" });
  }

  get(idOrSlug: string): Promise<Org> {
    return this.client.request<Org>(`orgs/${RallyaClient.seg(idOrSlug)}`, { method: "GET" });
  }

  update(idOrSlug: string, input: UpdateOrgInput): Promise<Org> {
    return this.client.request<Org>(`orgs/${RallyaClient.seg(idOrSlug)}`, { method: "PATCH", body: input });
  }

  remove(idOrSlug: string): Promise<void> {
    return this.client.request<void>(`orgs/${RallyaClient.seg(idOrSlug)}`, { method: "DELETE" });
  }

  async listMembers(idOrSlug: string, q?: PageQuery): Promise<Page<OrgMember>> {
    const page = await this.client.request<Page<OrgMember>>(`orgs/${RallyaClient.seg(idOrSlug)}/members`, {
      method: "GET",
      query: q as Record<string, string | number | undefined>,
    });
    return withPage(q, page);
  }

  addMember(idOrSlug: string, input: { email: string; role?: string }): Promise<OrgMember> {
    return this.client.request<OrgMember>(`orgs/${RallyaClient.seg(idOrSlug)}/members`, {
      method: "POST",
      body: input,
    });
  }

  updateMemberRole(idOrSlug: string, userId: string, role: string): Promise<OrgMember> {
    return this.client.request<OrgMember>(
      `orgs/${RallyaClient.seg(idOrSlug)}/members/${RallyaClient.seg(userId)}`,
      { method: "PATCH", body: { role } },
    );
  }

  removeMember(idOrSlug: string, userId: string): Promise<void> {
    return this.client.request<void>(
      `orgs/${RallyaClient.seg(idOrSlug)}/members/${RallyaClient.seg(userId)}`,
      { method: "DELETE" },
    );
  }

  updateMyPreferences(idOrSlug: string, input: { notifyEvents?: boolean }): Promise<void> {
    return this.client.request<void>(`orgs/${RallyaClient.seg(idOrSlug)}/members/me`, {
      method: "PATCH",
      body: input,
    });
  }

  invite(idOrSlug: string, input: { email: string; role?: string }): Promise<OrgInvite> {
    return this.client.request<OrgInvite>(`orgs/${RallyaClient.seg(idOrSlug)}/invites`, {
      method: "POST",
      body: input,
    });
  }

  async listInvites(idOrSlug: string, q?: PageQuery): Promise<Page<OrgInvite>> {
    const page = await this.client.request<Page<OrgInvite>>(`orgs/${RallyaClient.seg(idOrSlug)}/invites`, {
      method: "GET",
      query: q as Record<string, string | number | undefined>,
    });
    return withPage(q, page);
  }

  revokeInvite(idOrSlug: string, inviteId: string): Promise<void> {
    return this.client.request<void>(
      `orgs/${RallyaClient.seg(idOrSlug)}/invites/${RallyaClient.seg(inviteId)}`,
      { method: "DELETE" },
    );
  }

  acceptInvite(token: string): Promise<{ message: string }> {
    return this.client.request("orgs/invites/accept", { method: "POST", body: { token } });
  }

  declineInvite(token: string): Promise<{ message: string }> {
    return this.client.request("orgs/invites/decline", { method: "POST", body: { token } });
  }

  listRoles(idOrSlug: string): Promise<CustomRole[]> {
    return this.client.request<CustomRole[]>(`orgs/${RallyaClient.seg(idOrSlug)}/roles`, { method: "GET" });
  }

  defineRole(idOrSlug: string, input: { name: string; permissions: Permission[] }): Promise<CustomRole> {
    return this.client.request<CustomRole>(`orgs/${RallyaClient.seg(idOrSlug)}/roles`, {
      method: "POST",
      body: input,
    });
  }

  updateRole(idOrSlug: string, role: string, permissions: Permission[]): Promise<CustomRole> {
    return this.client.request<CustomRole>(
      `orgs/${RallyaClient.seg(idOrSlug)}/roles/${RallyaClient.seg(role)}`,
      { method: "PATCH", body: { permissions } },
    );
  }

  deleteRole(idOrSlug: string, role: string): Promise<void> {
    return this.client.request<void>(
      `orgs/${RallyaClient.seg(idOrSlug)}/roles/${RallyaClient.seg(role)}`,
      { method: "DELETE" },
    );
  }

  assignRole(idOrSlug: string, role: string, userId: string): Promise<void> {
    return this.client.request<void>(
      `orgs/${RallyaClient.seg(idOrSlug)}/roles/${RallyaClient.seg(role)}/assign`,
      { method: "POST", body: { userId } },
    );
  }

  unassignRole(idOrSlug: string, role: string, userId: string): Promise<void> {
    return this.client.request<void>(
      `orgs/${RallyaClient.seg(idOrSlug)}/roles/${RallyaClient.seg(role)}/unassign`,
      { method: "POST", body: { userId } },
    );
  }
}
