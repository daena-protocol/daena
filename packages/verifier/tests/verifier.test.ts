import { beforeAll, describe, expect, it } from "vitest";
import type { DaenaDocument } from "@daena/core";
import {
  canonicalize,
  encodeMultibaseEd25519,
  decodeEd25519Multikey,
  base58Encode,
  base58Decode,
  generateEd25519KeyPair,
  sign,
  verify,
  StaticDIDResolver,
  WebDIDResolver,
  type DIDDocument,
  type KeyPair
} from "../src/index.js";

let keyPair: KeyPair;
let didDoc: DIDDocument;
let resolver: StaticDIDResolver;
let unsigned: Omit<DaenaDocument, "signature">;

const PUBLISHER = "did:web:test.example";
const KEY_ID = `${PUBLISHER}#key-1`;

beforeAll(() => {
  keyPair = generateEd25519KeyPair();
  didDoc = {
    id: PUBLISHER,
    verificationMethod: [
      {
        id: KEY_ID,
        type: "Multikey",
        controller: PUBLISHER,
        publicKeyMultibase: encodeMultibaseEd25519(keyPair.publicKey)
      }
    ]
  };
  resolver = new StaticDIDResolver({ [PUBLISHER]: didDoc });
  unsigned = {
    daena: "0",
    publisher: PUBLISHER,
    facts: [
      {
        id: "name",
        type: "https://daena.org/vocab/business/name",
        value: "Test Co.",
        asOf: "2026-05-22T00:00:00Z"
      },
      {
        id: "founded",
        type: "https://daena.org/vocab/business/founded",
        value: 2026,
        asOf: "2026-05-22T00:00:00Z"
      }
    ],
    capabilities: [],
    render: { title: "Test Co." }
  };
});

describe("canonicalize", () => {
  it("produces deterministic output regardless of key order", () => {
    const a = { b: 1, a: 2, c: 3 };
    const b = { c: 3, a: 2, b: 1 };
    expect(canonicalize(a)).toBe(canonicalize(b));
    expect(canonicalize(a)).toBe('{"a":2,"b":1,"c":3}');
  });

  it("handles nested objects and arrays", () => {
    const v = { z: [3, 2, 1], a: { y: 1, x: 2 } };
    expect(canonicalize(v)).toBe('{"a":{"x":2,"y":1},"z":[3,2,1]}');
  });

  it("preserves array order", () => {
    expect(canonicalize([3, 1, 2])).toBe("[3,1,2]");
  });

  it("encodes primitives correctly", () => {
    expect(canonicalize(null)).toBe("null");
    expect(canonicalize(true)).toBe("true");
    expect(canonicalize(false)).toBe("false");
    expect(canonicalize("hi")).toBe('"hi"');
    expect(canonicalize(42)).toBe("42");
    expect(canonicalize(1.5)).toBe("1.5");
  });

  it("throws on non-finite numbers", () => {
    expect(() => canonicalize(NaN)).toThrow();
    expect(() => canonicalize(Infinity)).toThrow();
  });
});

describe("base58", () => {
  it("round-trips random bytes", () => {
    for (let i = 0; i < 10; i++) {
      const bytes = new Uint8Array(32);
      crypto.getRandomValues(bytes);
      const encoded = base58Encode(bytes);
      const decoded = base58Decode(encoded);
      expect(Array.from(decoded)).toEqual(Array.from(bytes));
    }
  });

  it("preserves leading zero bytes as leading '1' characters", () => {
    const bytes = new Uint8Array([0, 0, 0, 1, 2, 3]);
    const encoded = base58Encode(bytes);
    expect(encoded.startsWith("111")).toBe(true);
    expect(Array.from(base58Decode(encoded))).toEqual(Array.from(bytes));
  });

  it("rejects invalid characters", () => {
    expect(() => base58Decode("0OIl")).toThrow();
  });
});

describe("multibase ed25519", () => {
  it("round-trips a public key through multibase encoding", () => {
    const encoded = encodeMultibaseEd25519(keyPair.publicKey);
    expect(encoded.startsWith("z")).toBe(true);
    const decoded = decodeEd25519Multikey(encoded);
    expect(Array.from(decoded)).toEqual(Array.from(keyPair.publicKey));
  });
});

describe("sign + verify roundtrip", () => {
  it("a freshly signed document verifies", async () => {
    const signed = sign(unsigned, {
      privateKey: keyPair.privateKey,
      keyId: KEY_ID
    });
    const result = await verify(signed, { resolver });
    expect(result.valid).toBe(true);
    expect(result.issues).toEqual([]);
    expect(result.publisher).toBe(PUBLISHER);
  });

  it("a tampered document does not verify", async () => {
    const signed = sign(unsigned, {
      privateKey: keyPair.privateKey,
      keyId: KEY_ID
    });
    const tampered: DaenaDocument = {
      ...signed,
      facts: [{ ...signed.facts[0]!, value: "Tampered Co." }, ...signed.facts.slice(1)]
    };
    const result = await verify(tampered, { resolver });
    expect(result.valid).toBe(false);
    expect(result.issues[0]?.path).toBe("signature.value");
    expect(result.issues[0]?.message).toContain("does not verify");
  });

  it("verification is independent of object key order", async () => {
    const signed = sign(unsigned, {
      privateKey: keyPair.privateKey,
      keyId: KEY_ID
    });
    const reordered: DaenaDocument = {
      signature: signed.signature,
      render: signed.render,
      capabilities: signed.capabilities,
      facts: signed.facts,
      publisher: signed.publisher,
      daena: signed.daena
    };
    const result = await verify(reordered, { resolver });
    expect(result.valid).toBe(true);
  });
});

describe("verify error paths", () => {
  it("rejects an unsupported algorithm", async () => {
    const signed = sign(unsigned, {
      privateKey: keyPair.privateKey,
      keyId: KEY_ID
    });
    const bad: DaenaDocument = {
      ...signed,
      signature: { ...signed.signature, algorithm: "rsa-sha256" }
    };
    const result = await verify(bad, { resolver });
    expect(result.valid).toBe(false);
    expect(result.issues[0]?.path).toBe("signature.algorithm");
    expect(result.issues[0]?.message).toContain("Unsupported algorithm");
  });

  it("rejects a placeholder signature cleanly (no crash)", async () => {
    const placeholder: DaenaDocument = {
      ...unsigned,
      signature: {
        algorithm: "ed25519",
        value: "PLACEHOLDER",
        keyId: KEY_ID
      }
    };
    const result = await verify(placeholder, { resolver });
    expect(result.valid).toBe(false);
    expect(result.issues[0]?.path).toBe("signature.value");
    expect(result.issues[0]?.message).toMatch(/64-byte/);
  });

  it("fails when the DID cannot be resolved", async () => {
    const signed = sign(unsigned, {
      privateKey: keyPair.privateKey,
      keyId: KEY_ID
    });
    const emptyResolver = new StaticDIDResolver({});
    const result = await verify(signed, { resolver: emptyResolver });
    expect(result.valid).toBe(false);
    expect(result.issues[0]?.path).toBe("publisher");
    expect(result.issues[0]?.message).toContain("Could not resolve");
  });

  it("fails when the signature's keyId is not in the DID document", async () => {
    const signed = sign(unsigned, {
      privateKey: keyPair.privateKey,
      keyId: `${PUBLISHER}#nonexistent-key`
    });
    const result = await verify(signed, { resolver });
    expect(result.valid).toBe(false);
    expect(result.issues[0]?.path).toBe("signature.keyId");
    expect(result.issues[0]?.message).toContain("not found");
  });

  it("WebDIDResolver rejects non-did:web methods", async () => {
    const r = new WebDIDResolver();
    await expect(r.resolve("did:key:z6Mk...")).rejects.toThrow(/did:web/);
  });
});
