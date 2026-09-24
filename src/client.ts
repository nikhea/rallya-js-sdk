import { RallyaError } from "./errors.js";
import {
  AuthResource,
  OrgsResource,
  EventsResource,
  TicketsResource,
  OrdersResource,
  PaymentsResource,
  AttendeesResource,
  CheckinResource,
  AuditResource,
  AdminResource,
  HealthResource,
} from "./resources/index.js";

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export type TokenStore = {
  getTokens: () => TokenPair | null | Promise<TokenPair | null>;
  setTokens: (t: TokenPair | null) => void | Promise<void>;
};

export interface RallyaClientOptions extends TokenStore {
  baseUrl: string;
  onAuthFailure?: () => void;
  fetchImpl?: typeof fetch;
}

export interface RequestOptions {
  method: string;
  query?: Record<string, string | number | boolean | undefined | null>;
  body?: unknown;
  formData?: FormData;
  headers?: Record<string, string>;
  /** Default true. Public routes + refresh pass false. */
  auth?: boolean;
  /** Internal: skip the 401→refresh→retry cycle. */
  retryAuth?: boolean;
}

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/+$/, "");
}

function buildUrl(base: string, path: string, query?: RequestOptions["query"]): string {
  const url = new URL(path, base + "/");
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, String(v));
    }
  }
  return url.toString();
}

function parseRetryAfter(res: Response): number | undefined {
  const raw = res.headers.get("retry-after");
  if (!raw) return undefined;
  const secs = Number(raw);
  if (Number.isFinite(secs)) return secs * 1000;
  const date = Date.parse(raw);
  if (Number.isFinite(date)) return Math.max(0, date - Date.now());
  return undefined;
}

async function throwForStatus(res: Response): Promise<never> {
  let payload: { error?: string; code?: string; message?: string; } | null = null;
  try {
    payload = (await res.json()) as { error?: string; code?: string; message?: string; };
  } catch {
    payload = null;
  }
  const message = payload?.error ?? payload?.message ?? `request failed with status ${res.status}`;
  throw new RallyaError({
    status: res.status,
    code: payload?.code,
    message,
    details: payload,
    retryAfterMs: res.status === 429 ? parseRetryAfter(res) : undefined,
  });
}

export class RallyaClient {
  readonly baseUrl: string;
  private readonly getTokens: TokenStore["getTokens"];
  private readonly setTokens: TokenStore["setTokens"];
  private readonly onAuthFailure?: () => void;
  private readonly fetchImpl: typeof fetch;
  private refreshPromise: Promise<TokenPair> | null = null;

  readonly auth: AuthResource;
  readonly orgs: OrgsResource;
  readonly events: EventsResource;
  readonly tickets: TicketsResource;
  readonly orders: OrdersResource;
  readonly payments: PaymentsResource;
  readonly attendees: AttendeesResource;
  readonly checkin: CheckinResource;
  readonly audit: AuditResource;
  readonly admin: AdminResource;
  readonly health: HealthResource;

  constructor(opts: RallyaClientOptions) {
    this.baseUrl = normalizeBaseUrl(opts.baseUrl);
    this.getTokens = opts.getTokens;
    this.setTokens = opts.setTokens;
    this.onAuthFailure = opts.onAuthFailure;
    this.fetchImpl =
      opts.fetchImpl ?? ((...args: Parameters<typeof fetch>) => fetch(...args));
    this.auth = new AuthResource(this);
    this.orgs = new OrgsResource(this);
    this.events = new EventsResource(this);
    this.tickets = new TicketsResource(this);
    this.orders = new OrdersResource(this);
    this.payments = new PaymentsResource(this);
    this.attendees = new AttendeesResource(this);
    this.checkin = new CheckinResource(this);
    this.audit = new AuditResource(this);
    this.admin = new AdminResource(this);
    this.health = new HealthResource(this);
  }

  /** Low-level request. Prefer typed resource methods. */
  async request<T>(path: string, opts: RequestOptions): Promise<T> {
    const doFetch = async (accessToken?: string): Promise<Response> => {
      const headers: Record<string, string> = { ...(opts.headers ?? {}) };
      if (opts.body !== undefined) headers["Content-Type"] = "application/json";
      if (accessToken && opts.auth !== false) headers["Authorization"] = `Bearer ${accessToken}`;
      return this.fetchImpl(buildUrl(this.baseUrl, path.replace(/^\/+/, ""), opts.query), {
        method: opts.method,
        headers,
        body: opts.formData ?? (opts.body !== undefined ? JSON.stringify(opts.body) : undefined),
      });
    };

    const tokens = opts.auth === false ? null : await this.getTokens();
    let res = await doFetch(tokens?.accessToken);
    if (res.status === 401 && opts.auth !== false && opts.retryAuth !== false && tokens?.refreshToken) {
      try {
        const rotated = await this.refreshSingleFlight(tokens.refreshToken);
        res = await doFetch(rotated.accessToken);
        if (res.status === 401) await this.failAuth();
      } catch (e) {
        if (e instanceof RallyaError && (e.status === 401 || e.status === 404)) await this.failAuth();
        throw e;
      }
      if (res.status === 401) return throwForStatus(res);
    }
    if (!res.ok) return throwForStatus(res);
    if (res.status === 204) return undefined as T;
    const text = await res.text();
    if (!text) return undefined as T;
    return JSON.parse(text) as T;
  }

  private async refreshSingleFlight(refreshToken: string): Promise<TokenPair> {
    if (!this.refreshPromise) {
      this.refreshPromise = this.request<TokenPair>("auth/refresh", {
        method: "POST",
        body: { refreshToken },
        auth: false,
        retryAuth: false,
      })
        .then(async (pair) => {
          await this.setTokens(pair);
          return pair;
        })
        .finally(() => {
          this.refreshPromise = null;
        });
    }
    return this.refreshPromise;
  }

  private async failAuth(): Promise<void> {
    try {
      await this.setTokens(null);
    } finally {
      this.onAuthFailure?.();
    }
  }

  /** Escape a UUID-or-slug path segment. */
  static seg(value: string): string {
    return encodeURIComponent(value);
  }

  /** Absolute-URL GET (for routes outside baseUrl, e.g. GET /health). */
  async absoluteGet<T>(url: string): Promise<T> {
    const res = await this.fetchImpl(url, { method: "GET" });
    if (!res.ok) return throwForStatus(res);
    return (await res.json()) as T;
  }
}
