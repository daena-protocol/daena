import { DaenaDocumentSchema } from "./schema.js";
import { DaenaParseError } from "./errors.js";
import type { DaenaDocument } from "./types.js";

/**
 * Parse and validate a Daena document.
 *
 * Accepts either a JSON string or an already-parsed value.
 * Throws DaenaParseError if the input fails v0 schema validation.
 */
export function parse(input: string | unknown): DaenaDocument {
  const raw = typeof input === "string" ? JSON.parse(input) : input;
  const result = DaenaDocumentSchema.safeParse(raw);
  if (!result.success) {
    throw new DaenaParseError(result.error);
  }
  return result.data as DaenaDocument;
}

/**
 * Non-throwing variant of parse(). Returns a result object so callers can
 * branch without try/catch.
 */
export type ParseResult =
  | { ok: true; doc: DaenaDocument }
  | { ok: false; error: DaenaParseError };

export function tryParse(input: string | unknown): ParseResult {
  try {
    return { ok: true, doc: parse(input) };
  } catch (e) {
    if (e instanceof DaenaParseError) return { ok: false, error: e };
    throw e;
  }
}
