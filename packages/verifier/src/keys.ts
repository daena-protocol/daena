import type { DIDDocument } from "./did.js";
import { decodeEd25519Multikey } from "./multibase.js";

export interface ResolvedKey {
  algorithm: "ed25519";
  publicKey: Uint8Array;
}

/**
 * Look up a verification method by its keyId and decode its public key.
 *
 * keyId may be:
 *   - a full DID URL ("did:web:example.com#key-1")
 *   - a fragment-only reference ("#key-1")
 *   - a bare fragment ("key-1")
 */
export function findKey(didDoc: DIDDocument, keyId: string): ResolvedKey {
  const method = didDoc.verificationMethod?.find((m) => matchesKeyId(m.id, keyId, didDoc.id));
  if (!method) {
    throw new Error(`Verification method not found in DID document: ${keyId}`);
  }

  if (method.type !== "Multikey" && method.type !== "Ed25519VerificationKey2020") {
    throw new Error(
      `Unsupported verification method type '${method.type}' (v0 supports Multikey and Ed25519VerificationKey2020)`
    );
  }

  if (!method.publicKeyMultibase) {
    throw new Error(
      `Verification method ${method.id} has no publicKeyMultibase (publicKeyJwk is not supported in v0)`
    );
  }

  return {
    algorithm: "ed25519",
    publicKey: decodeEd25519Multikey(method.publicKeyMultibase)
  };
}

function matchesKeyId(methodId: string, keyId: string, didId: string): boolean {
  if (methodId === keyId) return true;
  // Fragment-only references
  const methodFragment = methodId.includes("#")
    ? methodId.slice(methodId.indexOf("#"))
    : `#${methodId}`;
  const keyFragment = keyId.startsWith("#")
    ? keyId
    : keyId.includes("#")
      ? keyId.slice(keyId.indexOf("#"))
      : `#${keyId}`;
  if (methodFragment === keyFragment) return true;
  // Allow methodId of form "did:web:foo#key-1" against keyId "did:web:foo#key-1"
  if (`${didId}${keyFragment}` === methodId) return true;
  return false;
}
