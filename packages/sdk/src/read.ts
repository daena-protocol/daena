import { parse, type DaenaDocument } from "@daena/core";
import { verify, WebDIDResolver, type DIDResolver } from "@daena/verifier";
import { DaenaReadError, DaenaVerifyError } from "./errors.js";

export interface ReadOptions {
  /** Verify the signature against the publisher's DID. Default: true. */
  verify?: boolean;
  /** DID resolver. Default: WebDIDResolver (uses global fetch). */
  resolver?: DIDResolver;
  /** Fetch implementation. Default: global fetch. */
  fetchImpl?: typeof fetch;
  /** Request timeout in milliseconds. Default: 10000. */
  timeoutMs?: number;
}

/**
 * Fetch a Daena document from a URL and (by default) verify its signature.
 *
 * Returns a typed, validated, verified DaenaDocument — or throws:
 *   - DaenaReadError on HTTP / network / timeout failures
 *   - DaenaParseError on schema-invalid responses
 *   - DaenaVerifyError on failed signature verification
 */
export async function read(
  url: string,
  options: ReadOptions = {}
): Promise<DaenaDocument> {
  const fetchImpl =
    options.fetchImpl ?? globalThis.fetch.bind(globalThis);
  const verifyEnabled = options.verify !== false;
  const timeoutMs = options.timeoutMs ?? 10_000;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;
  try {
    response = await fetchImpl(url, {
      headers: { Accept: "application/json" },
      signal: controller.signal
    });
  } catch (e) {
    throw new DaenaReadError(
      `Failed to fetch ${url}: ${e instanceof Error ? e.message : String(e)}`,
      { cause: e }
    );
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    throw new DaenaReadError(
      `HTTP ${response.status} fetching ${url}`,
      { status: response.status }
    );
  }

  const text = await response.text();
  const doc = parse(text); // throws DaenaParseError

  if (verifyEnabled) {
    const result = await verify(doc, { resolver: options.resolver });
    if (!result.valid) {
      throw new DaenaVerifyError(
        `Signature verification failed for ${doc.publisher}`,
        result.issues
      );
    }
  }

  return doc;
}

/** Non-throwing variant of read(). Returns a result object. */
export type ReadResult =
  | { ok: true; doc: DaenaDocument }
  | { ok: false; error: Error };

export async function tryRead(
  url: string,
  options: ReadOptions = {}
): Promise<ReadResult> {
  try {
    const doc = await read(url, options);
    return { ok: true, doc };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e : new Error(String(e)) };
  }
}
