/**
 * DID resolution.
 *
 * v0 supports did:web only. did:web resolves by fetching the DID document
 * at a well-known URL:
 *
 *   did:web:example.com                  → https://example.com/.well-known/did.json
 *   did:web:example.com:users:alice      → https://example.com/users/alice/did.json
 *
 * The DID document MUST contain a verificationMethod entry whose id matches
 * the keyId of the signature being verified, and whose publicKeyMultibase
 * holds the ed25519 public key encoded as base58btc with the 0xed 0x01
 * multicodec prefix.
 */

export interface VerificationMethod {
  id: string;
  type: string;
  controller: string;
  publicKeyMultibase?: string;
  publicKeyJwk?: unknown;
}

export interface DIDDocument {
  id: string;
  verificationMethod?: VerificationMethod[];
}

export interface DIDResolver {
  resolve(did: string): Promise<DIDDocument>;
}

/** Resolves did:web identifiers by fetching the well-known DID document. */
export class WebDIDResolver implements DIDResolver {
  private fetchImpl: typeof fetch;

  constructor(fetchImpl?: typeof fetch) {
    this.fetchImpl = fetchImpl ?? globalThis.fetch.bind(globalThis);
  }

  async resolve(did: string): Promise<DIDDocument> {
    if (!did.startsWith("did:web:")) {
      throw new Error(
        `WebDIDResolver only supports did:web (got ${did.split(":").slice(0, 2).join(":")})`
      );
    }
    const idPart = did.slice("did:web:".length).split("#")[0]!;
    const segments = idPart.split(":");
    const domain = decodeURIComponent(segments[0]!);
    const path = segments.slice(1).map(decodeURIComponent).join("/");
    const url = path
      ? `https://${domain}/${path}/did.json`
      : `https://${domain}/.well-known/did.json`;

    const resp = await this.fetchImpl(url);
    if (!resp.ok) {
      throw new Error(`Failed to fetch ${url}: HTTP ${resp.status}`);
    }
    return (await resp.json()) as DIDDocument;
  }
}

/** In-memory resolver for tests. Maps DIDs to pre-built DID documents. */
export class StaticDIDResolver implements DIDResolver {
  private docs: Map<string, DIDDocument>;

  constructor(docs: Map<string, DIDDocument> | Record<string, DIDDocument>) {
    this.docs =
      docs instanceof Map ? docs : new Map(Object.entries(docs));
  }

  async resolve(did: string): Promise<DIDDocument> {
    const baseDID = did.split("#")[0]!;
    const doc = this.docs.get(baseDID);
    if (!doc) {
      throw new Error(`No DID document available for ${baseDID}`);
    }
    return doc;
  }
}
