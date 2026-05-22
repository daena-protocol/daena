import type { Fact } from "@daena/core";
import { escapeText } from "../util.js";

/** Fallback renderer for facts not handled by a vocabulary-aware renderer. */
export function renderGenericFact(fact: Fact): string {
  const label = fact.id.charAt(0).toUpperCase() + fact.id.slice(1);
  const body =
    typeof fact.value === "string" || typeof fact.value === "number"
      ? `<p>${escapeText(String(fact.value))}</p>`
      : `<pre class="generic-value">${escapeText(JSON.stringify(fact.value, null, 2))}</pre>`;
  return `<section class="section">
  <h2 class="section-title">${escapeText(label)}</h2>
  ${body}
</section>`;
}
