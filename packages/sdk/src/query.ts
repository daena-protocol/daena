import type { Capability, DaenaDocument, Fact } from "@daena/core";

/** Find a fact in a Daena document by its `id`. */
export function findFact(doc: DaenaDocument, id: string): Fact | undefined {
  return doc.facts.find((f) => f.id === id);
}

/**
 * Find all facts whose `type` URI matches.
 * Accepts an exact URI or a suffix (e.g. "business/hours") for vocab-aware
 * lookup without typing the full URL.
 */
export function findFactsByType(
  doc: DaenaDocument,
  type: string
): Fact[] {
  return doc.facts.filter((f) => f.type === type || f.type.endsWith(type));
}

/** Find a capability by its `id` or its human-readable `name`. */
export function findCapability(
  doc: DaenaDocument,
  idOrName: string
): Capability | undefined {
  return doc.capabilities.find((c) => c.id === idOrName || c.name === idOrName);
}
