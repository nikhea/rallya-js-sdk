# @rallya/sdk

Universal fetch-based JS/TS SDK for the Rallya event platform API (`/api/v1`).

- Zero runtime deps, Node >= 18, browsers, edge.
- `src/generated/schema.ts` is codegen from `../rallya/docs/swagger.json` — never hand-edit. Run `npm run gen`.
- `src/types.ts` holds hand-friendly types mapped from Go DTOs.

## Quickstart

```ts
import { RallyaClient } from "@rallya/sdk";

let tokens = null;
const client = new RallyaClient({
  baseUrl: "http://localhost:8080/api/v1",
  getTokens: () => tokens,
  setTokens: (t) => { tokens = t; },
  onAuthFailure: () => { tokens = null; },
});

const pair = await client.auth.login({ email: "j@test.com", password: "secret123" });
tokens = pair;
const me = await client.auth.me();
```

## Server-to-server (API key)

Mint a per-org key with user auth (`POST /api/v1/orgs/:id/api-keys`,
ADMIN+), then use it without a token store. The raw secret is shown
once — store it as an env var.

```ts
import { RallyaClient } from "@rallya/sdk";

const client = new RallyaClient({
  baseUrl: "http://localhost:8080/api/v1",
  apiKey: process.env.RALLYA_API_KEY!, // rk_live_* ...
  onAuthFailure: () => { /* key revoked/expired */ },
});

// Same resource methods; X-API-Key is sent, no refresh cycle.
const org = await client.orgs.get("acme");
await client.checkin.scan("acme", "fest-2026", { code: "qr-payload" });
```

Keys are org-bound with snapshotted `scopes` (e.g. `checkin:create`),
act as their creator for membership checks, and can never manage
keys or touch `/admin/*`.
