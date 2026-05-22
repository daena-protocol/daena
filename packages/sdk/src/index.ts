export { read, tryRead } from "./read.js";
export type { ReadOptions, ReadResult } from "./read.js";

export { act } from "./act.js";
export type { ActOptions, ActResult } from "./act.js";

export { findFact, findFactsByType, findCapability } from "./query.js";

export { DaenaClient } from "./client.js";

export {
  DaenaReadError,
  DaenaVerifyError,
  DaenaActError,
  DaenaParseError
} from "./errors.js";

// Re-exports from @daena/verifier for agents that don't want to depend on
// it directly (testing, offline verification, configuring custom resolvers).
export { StaticDIDResolver, WebDIDResolver } from "@daena/verifier";
export type {
  DIDDocument,
  DIDResolver,
  VerificationMethod,
  VerificationIssue
} from "@daena/verifier";
