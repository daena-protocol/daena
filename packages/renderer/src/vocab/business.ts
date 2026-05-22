import type { Fact } from "@daena/core";
import { escapeText } from "../util.js";

/**
 * Renderer for facts under https://daena.org/vocab/business/*.
 * Returns null if the fact is not a business-vocab fact, "" to hide it.
 */
export function renderBusinessFact(fact: Fact): string | null {
  if (!fact.type.includes("/business/")) return null;

  if (fact.type.endsWith("/business/name")) {
    // The name is rendered in the header; don't repeat it as a section.
    return "";
  }

  if (fact.type.endsWith("/business/address")) {
    const a = fact.value as {
      street?: string;
      city?: string;
      region?: string;
      postalCode?: string;
      country?: string;
    };
    return `<section class="section">
  <h2 class="section-title">Address</h2>
  <address class="address">
    ${escapeText(a.street ?? "")}<br>
    ${escapeText(a.city ?? "")}, ${escapeText(a.region ?? "")} ${escapeText(a.postalCode ?? "")}<br>
    ${escapeText(a.country ?? "")}
  </address>
</section>`;
  }

  if (fact.type.endsWith("/business/hours")) {
    const hours = fact.value as Array<{
      day: string;
      open: string;
      close: string;
    }>;
    const rows = hours
      .map(
        (h) =>
          `<tr><td>${escapeText(h.day)}</td><td>${escapeText(h.open)} – ${escapeText(h.close)}</td></tr>`
      )
      .join("\n      ");
    return `<section class="section">
  <h2 class="section-title">Hours</h2>
  <table><tbody>
      ${rows}
  </tbody></table>
</section>`;
  }

  return null;
}
