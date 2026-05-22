/**
 * End-to-end Daena demo.
 *
 * Loads a real Daena document, validates it through @daena/core,
 * renders it through @daena/renderer, and writes the resulting
 * human view to demo.html.
 *
 * Run with: npm run demo
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { parse } from "@daena/core";
import { render } from "@daena/renderer";

const here = dirname(fileURLToPath(import.meta.url));
const fixturePath = join(here, "pho-saigon.daena.json");
const outputPath = join(here, "..", "demo.html");

const raw = readFileSync(fixturePath, "utf8");

// 1. Parse + validate. The agent layer in action.
const doc = parse(raw);

// 2. Read a fact the way an agent would.
const hoursFact = doc.facts.find((f) => f.id === "hours");
const friday = (hoursFact?.value as Array<{ day: string; open: string; close: string }>)
  ?.find((h) => h.day === "fri");

// 3. Render the human view.
const html = render(doc);
writeFileSync(outputPath, html, "utf8");

console.log("");
console.log("  Daena demo — both layers, from one source.");
console.log("");
console.log("  Agent layer:");
console.log(`    publisher       ${doc.publisher}`);
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
