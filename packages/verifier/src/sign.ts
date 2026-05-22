import type { DaenaDocument } from "@daena/core";
import { canonicalize } from "./canonicalize.js";
import { signEd25519 } from "./crypto.js";

export interface SignOptions {
  /** 32-byte ed25519 seed (private key material). */
  privateKey: Uint8Array;
  /** DID URL identifying the signing key (e.g. "did:web:example.com#key-1"). */
  keyId: string;
}

/**
 * Sign a Daena document with an ed25519 private key.
 *
 * Takes a document MINUS its signature field (or with any signature — it will
 * be replaced) and returns a complete document with a populated signature.
 *
 * The signature is computed over the canonical JSON of every field except
 * the signature itself.
 */
export function sign(
  doc: Omit<DaenaDocument, "signature"> & { signature?: unknown },
  options: SignOptions
): DaenaDocument {
  const { signature: _drop, ...rest } = doc;
  const message = new TextEncoder().encode(canonicalize(rest));
  const sigBytes = signEd25519(message, options.privateKey);
  return {
    ...(rest as Omit<DaenaDocument, "signature">),
    signature: {
      algorithm: "ed25519",
      value: Buffer.from(sigBytes).toString("base64"),
      keyId: options.keyId
    }
  };
}
