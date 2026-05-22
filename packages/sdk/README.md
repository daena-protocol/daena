# @daena/sdk

The agent-side SDK for the Daena Protocol.

Where `@daena/cli` is for publishers, `@daena/sdk` is for the agents and applications that *consume* signed Daena documents. Verifying-by-default reads, capability invocation, and small query helpers — nothing more, nothing less.

## Install

```bash
npm install @daena/sdk
```

## Read — fetches, verifies, returns a typed document

```ts
import { read } from "@daena/sdk";

const doc = await read("https://phosaigon.example/daena.json");

// You only reach this line if:
//   ✓ The fetch succeeded
//   ✓ The document is schema-valid against Daena Protocol v0
//   ✓ The signature verifies against the publisher's DID
```

If any step fails, `read()` throws a typed error so agents can branch on the failure mode:

```ts
import {
  read,
  DaenaReadError,    // HTTP / network / timeout
  DaenaParseError,   // schema-invalid response
  DaenaVerifyError   // signature failed
} from "@daena/sdk";

try {
  const doc = await read(url);
} catch (e) {
  if (e instanceof DaenaVerifyError) {
    console.error("Untrusted source:", e.issues);
  } else if (e instanceof DaenaReadError) {
    console.error("Network or HTTP error:", e.message);
  } else if (e instanceof DaenaParseError) {
    console.error("Schema error:", e.issues);
  }
}
```

For a non-throwing variant, use `tryRead(url)` — it returns `{ ok: true, doc } | { ok: false, error }`.

## Query — find facts and capabilities

```ts
import { findFact, findFactsByType, findCapability } from "@daena/sdk";

const hours = findFact(doc, "hours");
const allBusinessFacts = findFactsByType(doc, "business");   // suffix match works
const reservation = findCapability(doc, "reserve");           // by id
const reservationAlt = findCapability(doc, "Make a reservation"); // by name
```

## Act — invoke a capability the publisher offers

```ts
import { act } from "@daena/sdk";

const result = await act(doc, "reserve", {
  partySize: 4,
  dateTime: "2026-05-22T19:00:00Z",
  name: "Pouyan",
  phone: "+1-555-1234"
});

if (result.ok) {
  console.log("Reservation confirmed:", result.body);
} else {
  console.log("Publisher returned", result.status, result.body);
}
```

`act()` validates required parameters before sending, attaches `Bearer` auth when the capability requires it (`options.bearer`), and returns a structured result rather than throwing on non-2xx responses. The result includes the resolved `capability` for downstream logging.

## Configured client

For long-lived agents that want to set defaults once:

```ts
import { DaenaClient } from "@daena/sdk";

const client = new DaenaClient({
  bearer: process.env.AGENT_BEARER_TOKEN,
  timeoutMs: 5000
});

const doc = await client.read("https://phosaigon.example/daena.json");
const result = await client.act(doc, "reserve", { partySize: 4, ... });
```

## Testing your agent

Both `read()` and `act()` accept a custom `fetchImpl`, and `read()` accepts a `resolver` for the DID layer. This means you can test agents against canned Daena documents with zero network calls:

```ts
import { read, StaticDIDResolver } from "@daena/sdk";
import signedDoc from "./fixtures/restaurant.daena.json";
import didDoc from "./fixtures/restaurant.did.json";

const doc = await read("https://restaurant.example/daena.json", {
  fetchImpl: async () => new Response(JSON.stringify(signedDoc), { status: 200 }),
  resolver: new StaticDIDResolver({ [didDoc.id]: didDoc })
});
```

## v0 scope

- HTTPS GET for reads, HTTPS POST for capability invocation
- Bearer auth on capabilities (`did` auth is reserved for v1)
- 10-second default timeout on read, 30-second default on act
- JSON request and response bodies

`SUBSCRIBE` and `VERIFY` verbs (per [SPEC.md §6](https://github.com/daena-protocol/spec/blob/main/SPEC.md)) are not in this v0 release. Subscribe needs a server-side push channel design; verify-by-key-id will land alongside the next verifier release.

## License

[Apache-2.0](../../LICENSE).
