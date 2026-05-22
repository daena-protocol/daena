/**
 * Multibase + multicodec helpers for ed25519 public keys.
 *
 * - "Multibase" is a one-character prefix indicating the base encoding.
 *   We support 'z' (base58btc, the DID-key default).
 * - "Multicodec" is a varint prefix on the decoded bytes indicating the key type.
 *   Ed25519 public keys use the prefix bytes 0xed, 0x01.
 */
import { base58Decode, base58Encode } from "./base58.js";

const ED25519_PUB_MULTICODEC = new Uint8Array([0xed, 0x01]);
const ED25519_KEY_LENGTH = 32;

export function decodeMultibase(encoded: string): Uint8Array {
  if (encoded.length === 0) {
    throw new Error("Empty multibase string");
  }
  const prefix = encoded[0]!;
  switch (prefix) {
    case "z":
      return base58Decode(encoded.slice(1));
    case "m":
      // base64 without padding
      return Uint8Array.from(Buffer.from(encoded.slice(1), "base64"));
    default:
      throw new Error(
        `Unsupported multibase prefix: '${prefix}' (only 'z' base58btc supported in v0)`
      );
  }
}

export function encodeMultibaseEd25519(publicKey: Uint8Array): string {
  if (publicKey.length !== ED25519_KEY_LENGTH) {
    throw new Error(
      `Expected ${ED25519_KEY_LENGTH}-byte ed25519 public key, got ${publicKey.length}`
    );
  }
  const prefixed = new Uint8Array(
    ED25519_PUB_MULTICODEC.length + publicKey.length
  );
  prefixed.set(ED25519_PUB_MULTICODEC, 0);
  prefixed.set(publicKey, ED25519_PUB_MULTICODEC.length);
  return "z" + base58Encode(prefixed);
}

export function decodeEd25519Multikey(encoded: string): Uint8Array {
  const bytes = decodeMultibase(encoded);
  if (
    bytes.length < 2 ||
    bytes[0] !== ED25519_PUB_MULTICODEC[0] ||
    bytes[1] !== ED25519_PUB_MULTICODEC[1]
  ) {
    throw new Error(
      "Not an ed25519 multikey (expected 0xed 0x01 multicodec prefix)"
    );
  }
  const key = bytes.slice(2);
  if (key.length !== ED25519_KEY_LENGTH) {
    throw new Error(
      `Expected ${ED25519_KEY_LENGTH}-byte ed25519 key after multicodec prefix, got ${key.length}`
    );
  }
  return key;
}
