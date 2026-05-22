/**
 * Deterministic JSON serialization for the Daena Protocol.
 *
 * v0 implementation: keys sorted lexicographically (UTF-16), no whitespace,
 * standard ECMAScript number stringification, standard JSON string escaping.
 *
 * This is intentionally a subset of RFC 8785 (JSON Canonicalization Scheme).
 * It is sufficient for round-tripping documents within a single toolchain.
 * Full RFC 8785 compliance (number normalization edge cases) is targeted for v1.
 */
export function canonicalize(value: unknown): string {
  if (value === null || value === undefined) return "null";
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw new Error("Cannot canonicalize non-finite number");
    }
    return JSON.stringify(value);
  }
  if (typeof value === "string") return JSON.stringify(value);
  if (Array.isArray(value)) {
    return "[" + value.map(canonicalize).join(",") + "]";
  }
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const keys = Object.keys(obj).sort();
    const pairs = keys.map(
      (k) => JSON.stringify(k) + ":" + canonicalize(obj[k])
    );
    return "{" + pairs.join(",") + "}";
  }
  throw new Error(`Cannot canonicalize value of type ${typeof value}`);
}
