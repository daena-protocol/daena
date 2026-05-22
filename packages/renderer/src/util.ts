/** HTML-escape arbitrary input. Safe for both text content and attribute values. */
export function escapeText(s: unknown): string {
  return String(s).replace(/[&<>"']/g, (c) => {
    switch (c) {
      case "&": return "&amp;";
      case "<": return "&lt;";
      case ">": return "&gt;";
      case '"': return "&quot;";
      case "'": return "&#39;";
      default: return c;
    }
  });
}

export const escapeAttr = escapeText;
