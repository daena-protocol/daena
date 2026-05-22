# @daena/verifier

Signature verification and DID resolution for the Daena Protocol.

This is the structural anti-hallucination layer. Agents that trust unverified Daena documents are no better than agents scraping HTML. Always verify.

## What it does

Given a Daena document, this package:

- Resolves the publisher's DID to their current signing keys
- Reconstructs the canonical message that was signed
- Verifies the ed25519 signature
- Reports tampering, malformed signatures, missing keys, and resolution failures

## Quickstart

```ts
import { verify } from "@daena/verifier";
import { parse } from "@daena/core";

const doc = parse(jsonText);
const result = await verify(doc);

if (result.valid) {
  console.log("Trusted source:", result.publisher);
} else {
  for (const issue of result.issues) {
    console.error(`  ${issue.path}: ${issue.message}`);
  }
}
```

## Signing (for tooling and tests)

```ts
import { sign, generateEd25519KeyPair, encodeMultibaseEd25519 } from "@daena/verifier";

const { publicKey, privateKey } = generateEd25519KeyPair();

const signedDoc = sign(unsignedDoc, {
  privateKey,
  keyId: "did:web:example.com#key-1"
});

// Publish the public key in your DID document:
const publicKeyMultibase = encodeMultibaseEd25519(publicKey);
```

## Testing without network access

```ts
import { verify, StaticDIDResolver } from "@daena/verifier";

const resolver = new StaticDIDResolver({
  "did:web:example.com": {
    id: "did:web:example.com",
    verificationMethod: [
      {
        id: "did:web:example.com#key-1",
        type: "Multikey",
        controller: "did:web:example.com",
        publicKeyMultibase: "z6Mk..."
      }
    ]
  }
});

const result = await verify(signedDoc, { resolver });
```

## v0 scope

- **Algorithms:** Ed25519
- **DID methods:** `did:web`
- **Key formats:** `Multikey` and `Ed25519VerificationKey2020` with `publicKeyMultibase`
- **Canonicalization:** A subset of RFC 8785 (sorted keys, no whitespace). Full RFC 8785 number normalization is targeted for v1.

## License

[Apache-2.0](../../LICENSE).
