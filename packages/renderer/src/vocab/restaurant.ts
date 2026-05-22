import type { Fact } from "@daena/core";
import { escapeText } from "../util.js";

interface MenuItem {
  name: string;
  description?: string;
  price: { amount: number; currency: string };
  tags?: string[];
}

/** Renderer for facts under https://daena.org/vocab/restaurant/*. */
export function renderRestaurantFact(fact: Fact): string | null {
  if (!fact.type.includes("/restaurant/")) return null;

  if (fact.type.endsWith("/restaurant/menu")) {
    const items = fact.value as MenuItem[];
    const cards = items
      .map((item) => {
        const tags = (item.tags ?? [])
          .map((t) => `<span class="tag">${escapeText(t)}</span>`)
          .join("");
        return `<div class="menu-item">
    <div class="menu-item-header">
      <span class="menu-item-name">${escapeText(item.name)}</span>
      <span class="menu-item-price">${escapeText(formatPrice(item.price))}</span>
    </div>
    ${item.description ? `<p class="menu-item-desc">${escapeText(item.description)}</p>` : ""}
    ${tags ? `<div class="tags">${tags}</div>` : ""}
  </div>`;
      })
      .join("\n  ");
    return `<section class="section">
  <h2 class="section-title">Menu</h2>
  ${cards}
</section>`;
  }

  return null;
}

function formatPrice(p: { amount: number; currency: string }): string {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: p.currency
    }).format(p.amount);
  } catch {
    return `${p.amount} ${p.currency}`;
  }
}
