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
