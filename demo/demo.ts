/**
 * End-to-end Daena demo.
 *
 * Loads a real, signed Daena document. Verifies its signature against
 * the publisher's DID document. Then reads facts the way an agent would
 * and renders the human view to demo.html.
 *
 * Run with: npm run demo
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { parse } from "@daena/core";
import { render } from "@daena/renderer";
import { verify, StaticDIDResolver, type DIDDocument } from "@daena/verifier";

const here = dirname(fileURLToPath(import.meta.url));
const fixturePath = join(here, "pho-saigon.daena.json");
const didDocPath = join(here, "pho-saigon.did.json");
const outputPath = join(here, "..", "demo.html");

// Load both the signed document and the publisher's DID document.
const doc = parse(readFileSync(fixturePath, "utf8"));
const didDoc = JSON.parse(readFileSync(didDocPath, "utf8")) as DIDDocument;

// 1. Verify the signature against the local DID document.
const resolver = new StaticDIDResolver({ [didDoc.id]: didDoc });
const verification = await verify(doc, { resolver });

// 2. Read a fact the way an agent would.
const hoursFact = doc.facts.find((f) => f.id === "hours");
const friday = (hoursFact?.value as Array<{ day: string; open: string; close: string }>)
  ?.find((h) => h.day === "fri");

// 3. Render the human view.
const html = render(doc);
writeFileSync(outputPath, html, "utf8");

console.log("");
console.log("  Daena demo — verified end-to-end.");
console.log("");
console.log("  Agent layer:");
console.log(`    publisher       ${doc.publisher}`);
if (verification.valid) {
  console.log(`    signature       ✓ verified against ${doc.signature.keyId}`);
} else {
  console.log(`    signature       ✗ ${verification.issues[0]?.message ?? "unverified"}`);
}
console.log(`    facts           ${doc.facts.length}  (verifiable, individually addressable)`);
console.log(`    capabilities    ${doc.capabilities.length}  (${doc.capabilities.map((c) => c.id).join(", ")})`);
if (friday) {
  console.log(`    friday hours    ${friday.open} – ${friday.close}  (read directly, no scraping)`);
}
console.log("");
console.log("  Human layer:");
console.log(`    rendered to     ${outputPath}`);
console.log(`    open with       open ${outputPath}`);
console.log("");
