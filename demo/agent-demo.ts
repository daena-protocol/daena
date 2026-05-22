/**
 * Agent-side Daena demo — the consumer half of the dual-layer story.
 *
 * Reads a real, signed Daena document the way an AI agent would: fetch the
 * URL, verify the signature against the publisher's DID, then introspect
 * facts and invoke a capability — all without scraping a single line of HTML.
 *
 * Pairs with demo.ts (publisher side). Run with: npm run agent-demo
 *
 * Network calls are mocked: the fetch reads the local fixture and the local
 * DID document, so the demo runs entirely offline.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
  read,
  act,
  findFact,
  StaticDIDResolver,
  type DIDDocument
} from "@daena/sdk";

const here = dirname(fileURLToPath(import.meta.url));
const localDoc = readFileSync(join(here, "pho-saigon.daena.json"), "utf8");
const didDoc = JSON.parse(
  readFileSync(join(here, "pho-saigon.did.json"), "utf8")
) as DIDDocument;

const DOC_URL = "https://phosaigon.example/daena.json";
const ACT_URL = "https://phosaigon.example/daena/act/reserve";

/** A mock fetch that intercepts the two URLs this demo touches. */
const mockFetch: typeof fetch = async (input, init) => {
  const url = typeof input === "string" ? input : input.toString();

  if (url === DOC_URL) {
    return new Response(localDoc, {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  }

  if (url === ACT_URL) {
    const params = JSON.parse((init?.body as string) ?? "{}");
    return new Response(
      JSON.stringify({
        confirmationId: "PSC-87432",
        partySize: params.partySize,
        time: params.dateTime,
        name: params.name,
        message: "Reserved. See you at the door."
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    );
  }

  return new Response("Not Found", { status: 404 });
};

const resolver = new StaticDIDResolver({ [didDoc.id]: didDoc });

console.log("");
console.log("  Daena agent demo — reading a verified document.");
console.log("");
console.log(`  GET  ${DOC_URL}`);

// 1. Read with verification.
const doc = await read(DOC_URL, { fetchImpl: mockFetch, resolver });

console.log(`  ✓ signature verified against ${doc.signature.keyId}`);
console.log(`  ✓ trusted source: ${doc.publisher}`);
console.log("");

// 2. Introspect facts the way an agent would.
const nameFact = findFact(doc, "name");
const addressFact = findFact(doc, "address");
const hoursFact = findFact(doc, "hours");
const menuFact = findFact(doc, "menu");

const address = addressFact?.value as {
  street: string;
  city: string;
  region: string;
  postalCode: string;
};
const hours = hoursFact?.value as Array<{
  day: string;
  open: string;
  close: string;
}>;
const friday = hours?.find((h) => h.day === "fri");
const menu = menuFact?.value as Array<{
  name: string;
  price: { amount: number; currency: string };
  tags?: string[];
}>;

const formatPrice = (p: { amount: number; currency: string }): string =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: p.currency
  }).format(p.amount);

console.log("  What I learned without scraping:");
console.log("");
console.log(`    Name        ${nameFact?.value as string}`);
console.log(
  `    Address     ${address.street}, ${address.city}, ${address.region} ${address.postalCode}`
);
if (friday) {
  console.log(`    Friday      ${friday.open} – ${friday.close}`);
}
console.log(`    Menu        ${menu?.length} items`);
for (const item of menu ?? []) {
  const price = formatPrice(item.price);
  const tags = (item.tags ?? []).join(", ");
  console.log(
    `                ${item.name.padEnd(14)} ${price.padStart(7)}${tags ? `   [${tags}]` : ""}`
  );
}
console.log("");
console.log(`  Capabilities offered: ${doc.capabilities.length}`);
for (const cap of doc.capabilities) {
  console.log(`    ${cap.id.padEnd(11)} POST ${cap.endpoint}`);
}
console.log("");

// 3. Invoke the reserve capability.
console.log("  Booking a table (mock invocation):");
console.log(`  POST ${ACT_URL}`);
const result = await act(
  doc,
  "reserve",
  {
    partySize: 4,
    dateTime: "2026-05-22T19:00:00Z",
    name: "Pouyan",
    phone: "+1-555-1234"
  },
  { fetchImpl: mockFetch }
);

if (result.ok) {
  const body = result.body as {
    confirmationId: string;
    partySize: number;
    time: string;
    message: string;
  };
  console.log(`  ✓ ${result.status} ${body.message}`);
  console.log(
    `    confirmationId: ${body.confirmationId}, partySize: ${body.partySize}, time: ${body.time}`
  );
} else {
  console.log(`  ✗ ${result.status}: ${JSON.stringify(result.body)}`);
}
console.log("");
