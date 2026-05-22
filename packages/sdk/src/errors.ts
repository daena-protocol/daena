import type { VerificationIssue } from "@daena/verifier";

/** Thrown when a Daena document can't be fetched (HTTP, network, timeout). */
export class DaenaReadError extends Error {
  /** Optional underlying cause (e.g., a fetch AbortError or HTTP status). */
  readonly status?: number;

  constructor(message: string, options?: { status?: number; cause?: unknown }) {
    super(message, options?.cause !== undefined ? { cause: options.cause } : undefined);
    this.name = "DaenaReadError";
    if (options?.status !== undefined) this.status = options.status;
  }
}

/** Thrown when a fetched document fails signature verification. */
export class DaenaVerifyError extends Error {
  readonly issues: VerificationIssue[];

  constructor(message: string, issues: VerificationIssue[]) {
    super(message);
    this.name = "DaenaVerifyError";
    this.issues = issues;
  }
}

/** Thrown when a capability invocation can't be assembled. (HTTP-level failures from the publisher are returned, not thrown.) */
export class DaenaActError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options?.cause !== undefined ? { cause: options.cause } : undefined);
    this.name = "DaenaActError";
  }
}

// Re-export for ergonomics so agents can `catch` all three with one import.
export { DaenaParseError } from "@daena/core";
