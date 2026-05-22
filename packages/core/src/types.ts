/**
 * Daena Protocol v0 — TypeScript types
 *
 * Derived from SPEC.md sections 2-5. These types track the editor's draft
 * and will evolve until v1.0.
 */

/** A cryptographic attestation by a publisher. */
export interface Signature {
  /** Algorithm identifier, e.g. "ed25519". */
  algorithm: string;
  /** Base64-encoded signature value. */
  value: string;
  /** DID URL identifying the key that produced the signature. */
  keyId: string;
}

/** A typed, dated, signed statement made by a publisher about a subject. */
export interface Fact {
  /** Stable identifier for this fact within the document. */
  id: string;
  /** URI identifying the vocabulary under which this fact is interpreted. */
  type: string;
  /** The fact's value. May be a primitive, object, or array. */
  value: unknown;
  /** ISO 8601 timestamp of when the fact was last asserted. */
  asOf: string;
  /** Optional per-fact signature. If absent, the document-level signature attests this fact. */
  signature?: Signature;
}

/** Typed parameter specification for a capability. */
export interface CapabilityParameter {
  type: "string" | "integer" | "number" | "boolean" | "datetime" | "phone" | "email";
  required: boolean;
  min?: number;
  max?: number;
  pattern?: string;
}

/** An action a publisher offers to agents. */
export interface Capability {
  /** Stable identifier for this capability within the document. */
  id: string;
  /** Human-readable label for the action. */
  name: string;
  /** URI identifying the capability vocabulary. */
  type: string;
  /** Typed parameter specifications keyed by parameter name. */
  parameters: Record<string, CapabilityParameter>;
  /** HTTPS endpoint where ACT requests are sent. */
  endpoint: string;
  /** Authentication mode required to invoke this capability. */
  auth: "none" | "bearer" | "did";
  /** Optional payment requirement. */
  price?: {
    amount: number;
    currency: string;
  };
}

/** Optional metadata that guides how a renderer produces a human view. */
export interface RenderHints {
  /** Title shown at the top of the rendered view. */
  title?: string;
  /** Ordered list of fact IDs to feature prominently. */
  primary?: string[];
  /** Ordered list of capability IDs to surface as primary actions. */
  callsToAction?: string[];
  /** Optional theming. */
  theme?: {
    accent?: string;
  };
}

/** A complete Daena document — the atomic unit of publication. */
export interface DaenaDocument {
  /** Protocol version. */
  daena: "0";
  /** Publisher identity as a Decentralized Identifier. */
  publisher: string;
  /** Signed statements made by the publisher. */
  facts: Fact[];
  /** Actions the publisher offers to agents. */
  capabilities: Capability[];
  /** Optional rendering metadata. */
  render?: RenderHints;
  /** Document-level signature. */
  signature: Signature;
}
