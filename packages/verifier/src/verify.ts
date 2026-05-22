import type { DaenaDocument } from "@daena/core";
import { canonicalize } from "./canonicalize.js";
import type { DIDResolver } from "./did.js";
import { WebDIDResolver } from "./did.js";
import { findKey } from "./keys.js";
import { verifyEd25519 } from "./crypto.js";

export interface VerifyOptions {
  /** Optional DID resolver. Defaults to WebDIDResolver (uses global fetch). */
  resolver?: DIDResolver;
}

export interface VerificationIssue {
  /** Dotted path into the document where the issue was found. */
  path: string;
  /** Human-readable description of the issue. */
  message: string;
}

export interface VerificationResult {
  /** True iff every signature in the document is verified against the publisher's DID. */
  valid: boolean;
  /** The publisher identifier that was checked. */
  publisher: string;
  /** Empty when valid; populated with the reason(s) when invalid. */
  issues: VerificationIssue[];
}

/**
 * Verify a Daena document's signature against its publisher's DID.
 *
 * Returns a structured result rather than throwing — callers can inspect
 * the `valid` flag and the `issues` array to decide what to do.
 */
export async function verify(
  doc: DaenaDocument,
  options: VerifyOptions = {}
): Promise<VerificationResult> {
  const resolver = options.resolver ?? new WebDIDResolver();
  const publisher = doc.publisher;

  // 1. Algorithm check (cheapest, do it first).
  if (doc.signature.algorithm !== "ed25519") {
    return failure(publisher, "signature.algorithm",
      `Unsupported algorithm '${doc.signature.algorithm}' (v0 supports ed25519 only)`);
  }

  // 2. Decode the signature bytes.
  let sigBytes: Uint8Array;
  try {
    sigBytes = Uint8Array.from(Buffer.from(doc.signature.value, "base64"));
  } catch (e) {
    return failure(publisher, "signature.value",
      `Could not base64-decode signature: ${e instanceof Error ? e.message : String(e)}`);
  }
  if (sigBytes.length !== 64) {
    return failure(publisher, "signature.value",
      `Expected a 64-byte ed25519 signature, got ${sigBytes.length} bytes (placeholder?)`);
  }

  // 3. Resolve the publisher's DID document.
  let didDoc;
  try {
    didDoc = await resolver.resolve(publisher);
  } catch (e) {
    return failure(publisher, "publisher",
      `Could not resolve DID: ${e instanceof Error ? e.message : String(e)}`);
  }

  // 4. Find the key referenced by the signature.
  let key;
  try {
    key = findKey(didDoc, doc.signature.keyId);
  } catch (e) {
    return failure(publisher, "signature.keyId",
      e instanceof Error ? e.message : String(e));
  }

  // 5. Reconstruct the signed message (canonical doc without the signature field).
  const { signature: _omit, ...rest } = doc;
  const message = new TextEncoder().encode(canonicalize(rest));

  // 6. Verify.
  let ok: boolean;
  try {
    ok = verifyEd25519(message, sigBytes, key.publicKey);
  } catch (e) {
    return failure(publisher, "signature.value",
      `Verification failed unexpectedly: ${e instanceof Error ? e.message : String(e)}`);
  }
  if (!ok) {
    return failure(publisher, "signature.value",
      "Signature does not verify (signature is invalid or the document was modified after signing)");
  }

  return { valid: true, publisher, issues: [] };
}

function failure(publisher: string, path: string, message: string): VerificationResult {
  return { valid: false, publisher, issues: [{ path, message }] };
}
