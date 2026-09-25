# @rallya/sdk

Universal fetch-based JS/TS SDK for the Rallya event platform API (`/api/v1`).

- Zero runtime dependencies. Node >= 18, browsers, edge workers.
- Typed resources over every API domain: auth, orgs, events, tickets, orders, payments, attendees, check-in, audit, admin, health.
- Automatic `401 → refresh → retry` (single-flight) for user sessions.
- `src/generated/schema.ts` is codegen from `../rallya/docs/swagger.json` — never hand-edit. Run `npm run gen`.
- `src/types.ts` holds hand-friendly types mapped 1:1 from the Go DTOs.

## Install

```bash
npm i @rallya/sdk
```

```ts
import { RallyaClient } from "@rallya/sdk";
```

Node-only webhook helpers live under a second entrypoint (browsers must
import `@rallya/sdk` only):

```ts
import { verifyStripeWebhookSignature } from "@rallya/sdk/node";
```

## Auth: user sessions

For browsers, mobile apps, and anything acting as a logged-in user.
Short-lived access JWT (15 min) + rotating refresh token (30 d), managed
through a token store you provide (memory, localStorage, secure store —
your choice).

```ts
import { RallyaClient, type TokenPair } from "@rallya/sdk";

let tokens: TokenPair | null = null;

const client = new RallyaClient({
  baseUrl: "http://localhost:8080/api/v1",
  getTokens: () => tokens,
  setTokens: (t) => { tokens = t; },
  onAuthFailure: () => { tokens = null; }, // refresh rejected: signed out
});

tokens = await client.auth.login({ email: "j@test.com", password: "secret123" });
const me = await client.auth.me();
await client.auth.logout(); // revokes server-side; clear tokens after
tokens = null;
```

`baseUrl` may include a trailing slash; org/event IDs accept UUID or slug
(the SDK encodes segments for you).

### Auth methods (`client.auth`)

| Method | Auth | Notes |
|---|---|---|
| `register({ email, password, firstName?, lastName? })` | no | Creates the account; verify email before login |
| `login({ email, password })` → `TokenPair` | no | Store the pair via `setTokens` |
| `refresh(refreshToken)` → `TokenPair` | no | Manual; auto-refresh already happens on 401 |
| `verifyEmail(token)` / `verifyEmailLink(token)` | no | Link token (24 h) |
| `verifyCode(email, code)` / `resendVerification(email)` | no | 6-digit OTP (10 min, 5 attempts) |
| `forgotPassword(email)` | no | Always 200 (no account enumeration) |
| `resetPassword(token, newPassword)` | no | Revokes all sessions |
| `logout()` | yes | Revokes session + tokens |
| `me()` → `Me` | yes | Profile + `organizations[]` |

## Auth: API keys (server-to-server)

For backend jobs, cron, door tablets, and CI — anything that can't do a
login + refresh dance. Keys are per-organization, long-lived, revocable,
and sent as `X-API-Key` (no refresh cycle, no token store).

Mint a key with user auth (ADMIN+):

```ts
// one-off, with a user-authed client
const created = await client.request<{
  id: string; prefix: string; key: string;
}>("orgs/acme/api-keys", {
  method: "POST",
  body: { name: "door-tablet-1", scopes: ["checkin:create"], expiresAt: "2027-01-01T00:00:00Z" },
});
console.log(created.key); // raw secret, shown ONCE — save to env
```

Then use it:

```ts
import { RallyaClient } from "@rallya/sdk";

const client = new RallyaClient({
  baseUrl: "http://localhost:8080/api/v1",
  apiKey: process.env.RALLYA_API_KEY!, // rk_live_* ...
  onAuthFailure: () => { /* key revoked / expired */ },
});

// Same resource methods; X-API-Key is sent automatically.
await client.checkin.scan("acme", "fest-2026", { code: "qr-payload" });
```

A static string or an async provider both work:

```ts
new RallyaClient({ baseUrl, apiKey: () => vault.read("rallya/api-key") });
```

Rules that apply to every key:

- **Org-bound.** A key for org A calling org B gets `403`. Pass exactly one of `apiKey` / TokenStore — both together throws at construction.
- **Scopes.** Snapshot of `object:action` grants (e.g. `event:read`, `checkin:create`, `*:*`). Non-empty scopes intersect the creator's live role; empty scopes inherit it. Unknown pairs are rejected at creation with `400`.
- **Key management needs user JWT.** Keys can never create/list/revoke keys (`403`) and can never touch `/admin/*`.
- **Fail-closed.** Revoked/expired keys, removed creators, and suspended users all yield `401`. Rotation = create new → dual-active grace → revoke old.

## Resources

### Orgs (`client.orgs`)

```ts
await client.orgs.create({ name: "Acme Inc", slug: "acme" });
await client.orgs.listMine();                       // Org[] with my role
await client.orgs.get("acme");                      // UUID or slug
await client.orgs.update("acme", { name: "Acme Corp" });
await client.orgs.remove("acme");                   // OWNER only

// members / invites / roles mirror the server's ADMIN+/OWNER gates
await client.orgs.listMembers("acme", { page: 1, perPage: 20 });
await client.orgs.invite("acme", { email: "jane@test.com", role: "MEMBER" });
await client.orgs.defineRole("acme", {
  name: "door", permissions: [{ object: "checkin", action: "create" }],
});
```

### Events (`client.events`)

```ts
// public discovery — no auth sent
await client.events.listPublic({ q: "jazz", status: "PUBLISHED", page: 1 });
await client.events.getPublic("fest-2026");

// org-scoped management
await client.events.create("acme", { title: "Fest", startsAt: "2026-10-01T18:00:00Z" });
await client.events.update("acme", "fest-2026", { venue: "Arena" });
await client.events.publish("acme", "fest-2026");
await client.events.unpublish("acme", "fest-2026");
await client.events.cancel("acme", "fest-2026");
await client.events.remove("acme", "fest-2026");
await client.events.uploadCover("acme", "fest-2026", file, "cover.png"); // ≤ 5 MB
await client.events.uploadImages("acme", "fest-2026", file, "stage.png");
```

### Tickets (`client.tickets`)

```ts
await client.tickets.listPublic("fest-2026");
await client.tickets.list("acme", "fest-2026");
await client.tickets.create("acme", "fest-2026", {
  name: "GA", priceCents: 2000, quantityTotal: 100, maxPerOrder: 4,
});
await client.tickets.update("acme", "fest-2026", "tick_123", { priceCents: 2500 });
await client.tickets.activate("acme", "fest-2026", "tick_123");
await client.tickets.pause("acme", "fest-2026", "tick_123");
await client.tickets.remove("acme", "fest-2026", "tick_123");
```

### Orders (`client.orders`)

Free orders confirm immediately; priced orders wait for payment.
`idempotencyKey` is auto-generated when omitted — pass your own to make
retries safe:

```ts
const order = await client.orders.create("fest-2026", {
  ticketTypeId: "tick_123",
  quantity: 2,
  idempotencyKey: "order-req-001", // optional
});
await client.orders.listMine({ page: 1, perPage: 20 });
await client.orders.get(order.id);
await client.orders.cancel(order.id);
```

### Payments (`client.payments`)

```ts
// Priced orders: Stripe Checkout. Returns the redirect URL — complete
// payment in the browser. 503 when Stripe is unconfigured server-side.
const { url, sessionId } = await client.payments.checkout(order.id);
window.location.href = url;
```

### Attendees (`client.attendees`)

```ts
await client.attendees.listMine();
await client.attendees.getMine(attendeeId);
await client.attendees.cancelMine(attendeeId);
await client.attendees.listRoster("acme", "fest-2026", { page: 1 });
await client.attendees.addWalkIn("acme", "fest-2026", { email: "walk@in.com" });
await client.attendees.correct("acme", "fest-2026", attendeeId, { name: "Jane" });
```

### Check-in (`client.checkin`)

Door scans never throw for refusals — they return `200 + outcome`
(`CHECKED_IN`, `ALREADY_CHECKED_IN`, `INVALID_CODE`, `CANCELLED`,
`WRONG_EVENT`, `REVERTED`):

```ts
await client.checkin.scan("acme", "fest-2026", { code: "qr-payload" });
// or: { attendeeId }
await client.checkin.scanBatch("acme", "fest-2026", codes); // ≤ 50 codes
await client.checkin.revert("acme", "fest-2026", attendeeId);
await client.checkin.stats("acme", "fest-2026"); // { registered, checkedIn, ... }
```

### Audit / Admin / Health

```ts
await client.audit.listOrg("acme", { action: "member.added", page: 1 });
await client.audit.listPlatform({ org: "acme" }); // superadmin
await client.admin.listOrgs({ page: 1 });         // superadmin
await client.health.live();  // GET <origin>/health (outside /api/v1)
await client.health.hello(); // public
```

### Pagination

List routes take `{ page?, perPage? }` (server defaults 1/20, max 100)
and return `{ items, total, page, perPage }`:

```ts
const { items, total } = await client.events.listPublic({ page: 2, perPage: 50 });
```

### Custom fetch

Pass `fetchImpl` to run on edge runtimes, tests, or instrumented clients:

```ts
new RallyaClient({ baseUrl, getTokens, setTokens, fetchImpl: myFetch });
```

## Errors

Every API failure throws `RallyaError` (`{ status, code?, message, details?, retryAfterMs? }`).
Stealth `404`s mean "not found **or** no access" for orgs, events, and
other people's orders — use the helper instead of treating 404 as absence:

```ts
import { RallyaError, isNotFoundOrForbidden } from "@rallya/sdk";

try {
  await client.orgs.get("acme");
} catch (e) {
  if (e instanceof RallyaError && e.isRateLimited) {
    await sleep(e.retryAfterMs ?? 1000); // 429 carries Retry-After
  }
  if (isNotFoundOrForbidden(e)) {
    // missing or no access — don't reveal which
  }
}
```

## Stripe webhooks (Node)

Verify signatures over the **raw** request body (frameworks must not
JSON-parse first). Needs `STRIPE_WEBHOOK_SIGNING_SECRET`:

```ts
import { verifyStripeWebhookSignature } from "@rallya/sdk/node";

const { verified, eventId } = verifyStripeWebhookSignature({
  rawBody, // string | Buffer, untouched
  signatureHeader: req.headers["stripe-signature"],
  webhookSecret: process.env.STRIPE_WEBHOOK_SIGNING_SECRET!,
});
```

## Development

```bash
npm run gen        # regen src/generated/schema.ts from ../rallya/docs/swagger.json
npm run gen:check  # fail if committed schema drifted from swagger.json
npm test           # vitest
npm run build      # tsup → dist/
```
