import type {
  Capability,
  DaenaDocument,
  Fact
} from "@daena/core";
import { baseStyles } from "./styles.js";
import { escapeAttr, escapeText } from "./util.js";
import { renderBusinessFact } from "./vocab/business.js";
import { renderRestaurantFact } from "./vocab/restaurant.js";
import { renderGenericFact } from "./vocab/generic.js";

/**
 * Render a Daena document to a complete HTML document string.
 *
 * The renderer is vocabulary-aware: facts with known types
 * (business, restaurant) get bespoke layouts, and unknown
 * types fall back to a generic JSON view.
 */
export function render(doc: DaenaDocument): string {
  const accent = doc.render?.theme?.accent ?? "#1f2937";
  const fallbackTitle = doc.render?.title ?? doc.publisher;

  // Order facts: render.primary first, then any remaining in document order.
  const factsById = new Map<string, Fact>(doc.facts.map((f) => [f.id, f]));
  const orderedFacts: Fact[] = [];
  for (const id of doc.render?.primary ?? []) {
    const fact = factsById.get(id);
    if (fact) {
      orderedFacts.push(fact);
      factsById.delete(id);
    }
  }
  for (const fact of factsById.values()) orderedFacts.push(fact);

  // Pull out a name fact for the header if one exists.
  const nameFact = orderedFacts.find((f) =>
    f.type.endsWith("/business/name")
  );
  const headerName =
    (typeof nameFact?.value === "string" ? nameFact.value : null) ??
    fallbackTitle;

  // Render facts. Drop empty strings (vocab-aware renderers signal
  // "intentionally hidden" with "").
  const sections = orderedFacts
    .map((fact) => renderFact(fact))
    .filter((s) => s !== "")
    .join("\n");

  // Render CTAs in the order from render.callsToAction, then any leftovers.
  const capsById = new Map<string, Capability>(
    doc.capabilities.map((c) => [c.id, c])
  );
  const orderedCaps: Capability[] = [];
  for (const id of doc.render?.callsToAction ?? []) {
    const cap = capsById.get(id);
    if (cap) {
      orderedCaps.push(cap);
      capsById.delete(id);
    }
  }
  for (const cap of capsById.values()) orderedCaps.push(cap);
  const ctaHtml = orderedCaps.map(renderCapability).join("\n");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="generator" content="@daena/renderer">
  <meta name="daena:publisher" content="${escapeAttr(doc.publisher)}">
  <title>${escapeText(headerName)}</title>
  <style>${baseStyles(accent)}</style>
</head>
<body>
  <div class="container">
    <header class="header">
      <h1 class="title">${escapeText(headerName)}</h1>
      <div class="publisher">${escapeText(doc.publisher)}</div>
    </header>
${sections}
${ctaHtml}
    <footer class="footer">
      Rendered from a Daena document · Verified facts, auto-generated view
    </footer>
  </div>
</body>
</html>
`;
}

function renderFact(fact: Fact): string {
  return (
    renderBusinessFact(fact) ??
    renderRestaurantFact(fact) ??
    renderGenericFact(fact)
  );
}

function renderCapability(cap: Capability): string {
  const inputs = Object.entries(cap.parameters)
    .map(([name, spec]) => {
      const inputType =
        spec.type === "datetime"
          ? "datetime-local"
          : spec.type === "phone"
            ? "tel"
            : spec.type === "email"
              ? "email"
              : spec.type === "integer" || spec.type === "number"
                ? "number"
                : "text";
      const minMax =
        (spec.min !== undefined ? ` min="${spec.min}"` : "") +
        (spec.max !== undefined ? ` max="${spec.max}"` : "");
      const inputId = `cap-${escapeAttr(cap.id)}-${escapeAttr(name)}`;
      return `<div>
      <label for="${inputId}">${escapeText(name)}${spec.required ? " *" : ""}</label>
      <input id="${inputId}" name="${escapeAttr(name)}" type="${inputType}"${spec.required ? " required" : ""}${minMax}>
    </div>`;
    })
    .join("\n    ");

  return `<section class="section">
  <h2 class="section-title">${escapeText(cap.name)}</h2>
  <form method="post" action="${escapeAttr(cap.endpoint)}">
    ${inputs}
    <button type="submit">${escapeText(cap.name)}</button>
  </form>
</section>`;
}
