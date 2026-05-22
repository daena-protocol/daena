import type { ZodError } from "zod";

export interface DaenaIssue {
  path: string;
  message: string;
}

export class DaenaParseError extends Error {
  readonly issues: DaenaIssue[];

  constructor(zodError: ZodError) {
    const issues: DaenaIssue[] = zodError.errors.map((e) => ({
      path: e.path.join(".") || "(root)",
      message: e.message
    }));
    const summary = issues
      .slice(0, 3)
      .map((i) => `${i.path}: ${i.message}`)
      .join("; ");
    const tail = issues.length > 3 ? ` (+${issues.length - 3} more)` : "";
    super(`Invalid Daena document — ${summary}${tail}`);
    this.name = "DaenaParseError";
    this.issues = issues;
  }
}
