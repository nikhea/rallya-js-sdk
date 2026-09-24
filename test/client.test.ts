import { describe, expect, it, vi } from "vitest";
import { RallyaClient, type TokenPair } from "../src/index.js";
import { RallyaError, isNotFoundOrForbidden } from "../src/index.js";

function jsonResponse(body: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...headers },
  });
}

function makeClient(opts: {
  tokens?: TokenPair | null;
  fetchImpl: typeof fetch;
  onAuthFailure?: () => void;
  baseUrl?: string;
}) {
  let tokens = opts.tokens ?? null;
  const setSpy = vi.fn((t: TokenPair | null) => {
    tokens = t;
  });
  const client = new RallyaClient({
    baseUrl: opts.baseUrl ?? "http://localhost:8080/api/v1",
    getTokens: () => tokens,
    setTokens: setSpy,
    onAuthFailure: opts.onAuthFailure,
    fetchImpl: opts.fetchImpl,
  });
  return { client, setSpy, getTokens: () => tokens };
}

describe("errors", () => {
  it("maps {error, code} envelope with status", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({ error: "email not verified", code: "EMAIL_NOT_VERIFIED" }, 403));
    const { client } = makeClient({ fetchImpl, tokens: { accessToken: "a", refreshToken: "r" } });
    await expect(client.auth.me()).rejects.toMatchObject({ status: 403, code: "EMAIL_NOT_VERIFIED" });
  });

  it("treats stealth 404 as not-found-or-forbidden", () => {
    expect(isNotFoundOrForbidden(new RallyaError({ status: 404, message: "organization not found" }))).toBe(true);
    expect(isNotFoundOrForbidden(new RallyaError({ status: 403, message: "forbidden" }))).toBe(true);
    expect(isNotFoundOrForbidden(new RallyaError({ status: 500, message: "boom" }))).toBe(false);
  });

  it("exposes retry-after on 429", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({ error: "rate limited" }, 429, { "retry-after": "2" }));
    const { client } = makeClient({ fetchImpl, tokens: { accessToken: "a", refreshToken: "r" } });
    const err = await client.auth.me().catch((e) => e as RallyaError);
    expect(err).toBeInstanceOf(RallyaError);
    expect(err.retryAfterMs).toBe(2000);
  });
});

describe("auth refresh", () => {
  it("retries once after single-flight refresh on 401", async () => {
    const calls: string[] = [];
    const fetchImpl = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
      const u = String(url);
      calls.push(`${init?.method} ${u}`);
      if (u.endsWith("auth/me") && !(init?.headers as Record<string, string>)["Authorization"]?.includes("new-access")) {
        return jsonResponse({ error: "unauthorized" }, 401);
      }
      if (u.endsWith("auth/refresh")) {
        return jsonResponse({ accessToken: "new-access", refreshToken: "new-refresh" }, 200);
      }
      return jsonResponse({ id: "u1", email: "j@t.com", emailVerified: true, profile: {} }, 200);
    });
    const onAuthFailure = vi.fn();
    const { client, setSpy, getTokens } = makeClient({
      fetchImpl: fetchImpl as unknown as typeof fetch,
      tokens: { accessToken: "old", refreshToken: "r" },
      onAuthFailure,
    });
    const me = await client.auth.me();
    expect(me.email).toBe("j@t.com");
    expect(setSpy).toHaveBeenCalledWith({ accessToken: "new-access", refreshToken: "new-refresh" });
    expect(getTokens()?.accessToken).toBe("new-access");
    expect(onAuthFailure).not.toHaveBeenCalled();
    expect(calls.filter((c) => c.includes("auth/refresh"))).toHaveLength(1);
  });

  it("clears tokens and calls onAuthFailure when refresh is rejected", async () => {
    const fetchImpl = vi.fn(async (url: string | URL | Request) => {
      const u = String(url);
      if (u.endsWith("auth/refresh")) return jsonResponse({ error: "unauthorized" }, 401);
      return jsonResponse({ error: "unauthorized" }, 401);
    });
    const onAuthFailure = vi.fn();
    const { client, setSpy } = makeClient({
      fetchImpl: fetchImpl as unknown as typeof fetch,
      tokens: { accessToken: "old", refreshToken: "stolen" },
      onAuthFailure,
    });
    await expect(client.auth.me()).rejects.toBeInstanceOf(RallyaError);
    expect(setSpy).toHaveBeenCalledWith(null);
    expect(onAuthFailure).toHaveBeenCalled();
  });
});

describe("resources", () => {
  it("auto-generates idempotency key on order create", async () => {
    let sentBody: { ticketTypeId: string; quantity: number; idempotencyKey?: string } | null = null;
    const fetchImpl = vi.fn(async (_u: string | URL | Request, init?: RequestInit) => {
      sentBody = JSON.parse(String(init?.body)) as typeof sentBody;
      return jsonResponse({ id: "o1" }, 200);
    });
    const { client } = makeClient({
      fetchImpl: fetchImpl as unknown as typeof fetch,
      tokens: { accessToken: "a", refreshToken: "r" },
    });
    await client.orders.create("event-slug", { ticketTypeId: "t1", quantity: 2 });
    expect(sentBody?.idempotencyKey).toBeTruthy();
  });

  it("rejects batch check-in over 50 codes without network", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({}, 200));
    const { client } = makeClient({
      fetchImpl: fetchImpl as unknown as typeof fetch,
      tokens: { accessToken: "a", refreshToken: "r" },
    });
    await expect(client.checkin.scanBatch("o", "e", Array(51).fill("c"))).rejects.toThrow(/50/);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("rejects oversized cover upload without network", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({}, 200));
    const { client } = makeClient({
      fetchImpl: fetchImpl as unknown as typeof fetch,
      tokens: { accessToken: "a", refreshToken: "r" },
    });
    const big = new Blob([new Uint8Array(5 * 1024 * 1024 + 1)]);
    await expect(client.events.uploadCover("o", "e", big, "cover.png")).rejects.toThrow(/5 MB/);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("encodes uuid-or-slug segments and trailing-slash baseUrl", async () => {
    let seenUrl = "";
    const fetchImpl = vi.fn(async (url: string | URL | Request) => {
      seenUrl = String(url);
      return jsonResponse({ id: "x" }, 200);
    });
    const { client } = makeClient({
      fetchImpl: fetchImpl as unknown as typeof fetch,
      tokens: { accessToken: "a", refreshToken: "r" },
      baseUrl: "http://localhost:8080/api/v1/",
    });
    await client.orgs.get("Acme Inc");
    expect(seenUrl).toBe("http://localhost:8080/api/v1/orgs/Acme%20Inc");
  });

  it("sends public routes without Authorization header", async () => {
    let authHeader: string | null = "unset";
    const fetchImpl = vi.fn(async (_u: string | URL | Request, init?: RequestInit) => {
      authHeader = (init?.headers as Record<string, string>)["Authorization"] ?? null;
      return jsonResponse({ items: [], total: 0 }, 200);
    });
    const { client } = makeClient({
      fetchImpl: fetchImpl as unknown as typeof fetch,
      tokens: { accessToken: "a", refreshToken: "r" },
    });
    await client.events.listPublic();
    expect(authHeader).toBeNull();
  });
});
