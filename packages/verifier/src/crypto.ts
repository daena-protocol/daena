/**
 * Ed25519 sign/verify wrappers over node:crypto.
 *
 * Public keys and private keys are exchanged as raw 32-byte Uint8Arrays.
 * Node wants DER-encoded keys, so we wrap raw seeds in SPKI / PKCS#8.
 */
import {
  createPrivateKey,
  createPublicKey,
  generateKeyPairSync,
  sign as nodeSign,
  verify as nodeVerify
} from "node:crypto";

export interface KeyPair {
  /** 32-byte ed25519 public key. */
  publicKey: Uint8Array;
  /** 32-byte ed25519 seed (private key material). */
  privateKey: Uint8Array;
}

// DER prefixes for SPKI/PKCS#8-wrapping of raw 32-byte ed25519 keys.
// These are constant for ed25519 — only the trailing 32 bytes change.
const SPKI_PREFIX = Buffer.from("302a300506032b6570032100", "hex");
const PKCS8_PREFIX = Buffer.from("302e020100300506032b657004220420", "hex");

export function generateEd25519KeyPair(): KeyPair {
  const { publicKey, privateKey } = generateKeyPairSync("ed25519");
  const pubDer = publicKey.export({ type: "spki", format: "der" });
  const privDer = privateKey.export({ type: "pkcs8", format: "der" });
  // The last 32 bytes of the DER encoding are the raw key material.
  return {
    publicKey: new Uint8Array(pubDer.subarray(pubDer.length - 32)),
    privateKey: new Uint8Array(privDer.subarray(privDer.length - 32))
  };
}

export function signEd25519(
  message: Uint8Array,
  privateKeySeed: Uint8Array
): Uint8Array {
  if (privateKeySeed.length !== 32) {
    throw new Error(
      `Expected 32-byte ed25519 seed, got ${privateKeySeed.length}`
    );
  }
  const der = Buffer.concat([PKCS8_PREFIX, Buffer.from(privateKeySeed)]);
  const keyObj = createPrivateKey({ key: der, format: "der", type: "pkcs8" });
  return new Uint8Array(nodeSign(null, Buffer.from(message), keyObj));
}

export function verifyEd25519(
  message: Uint8Array,
  signature: Uint8Array,
  publicKey: Uint8Array
): boolean {
  if (publicKey.length !== 32) {
    throw new Error(
      `Expected 32-byte ed25519 public key, got ${publicKey.length}`
    );
  }
  if (signature.length !== 64) {
    return false;
  }
  const der = Buffer.concat([SPKI_PREFIX, Buffer.from(publicKey)]);
  const keyObj = createPublicKey({ key: der, format: "der", type: "spki" });
  return nodeVerify(
    null,
    Buffer.from(message),
    keyObj,
    Buffer.from(signature)
  );
}
