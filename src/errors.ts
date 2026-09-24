// Typed error for all Rallya API failures.
// Server envelopes: {error} / {error, code}. Outsiders get stealth 404s.

export interface RallyaErrorInit {
  status: number;
  code?: string;
  message: string;
  details?: unknown;
  retryAfterMs?: number;
}

export class RallyaError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly details?: unknown;
  readonly retryAfterMs?: number;

  constructor(init: RallyaErrorInit) {
    super(init.message);
    this.name = "RallyaError";
    this.status = init.status;
    this.code = init.code;
    this.details = init.details;
    this.retryAfterMs = init.retryAfterMs;
  }

  get isUnauthorized(): boolean {
    return this.status === 401;
  }

  get isForbidden(): boolean {
    return this.status === 403;
  }

  get isNotFound(): boolean {
    return this.status === 404;
  }

  get isRateLimited(): boolean {
    return this.status === 429;
  }
}

/**
 * Stealth 404s mean "not found OR no access" for orgs, events,
 * and other people's orders. Use this helper instead of
 * treating 404 as pure absence.
 */
export function isNotFoundOrForbidden(err: unknown): boolean {
  return err instanceof RallyaError && (err.status === 404 || err.status === 403);
}
