export { verify } from "./verify.js";
export { sign } from "./sign.js";
export { canonicalize } from "./canonicalize.js";
export {
  generateEd25519KeyPair,
  signEd25519,
  verifyEd25519
} from "./crypto.js";
export type { KeyPair } from "./crypto.js";
export { base58Encode, base58Decode } from "./base58.js";
export {
  encodeMultibaseEd25519,
  decodeEd25519Multikey,
  decodeMultibase
} from "./multibase.js";
export {
  WebDIDResolver,
  StaticDIDResolver
} from "./did.js";
export type { DIDDocument, DIDResolver, VerificationMethod } from "./did.js";
export type {
  VerificationResult,
  VerificationIssue,
  VerifyOptions
} from "./verify.js";
export type { SignOptions } from "./sign.js";
