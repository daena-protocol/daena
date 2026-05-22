import { readFileSync } from "node:fs";
import { parse, DaenaParseError } from "@daena/core";
import {
  verify,
  StaticDIDResolver,
  WebDIDResolver,
  type DIDDocument,
  type DIDResolver
} from "@daena/verifier";
import { bold, dim, green, red } from "../ansi.js";
import { readStdin } from "../stdin.js";

interface ValidateOptions {
  file: string;
  quiet: boolean;
  verify: boolean;
  didDoc: string | undefined;
}

function parseArgs(args: string[]): ValidateOptions | null {
  let file: string | null = null;
  let quiet = false;
  let verifyFlag = false;
  let didDoc: string | undefined;
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "--quiet" || a === "-q") quiet = true;
    else if (a === "--verify") verifyFlag = true;
    else if (a === "--did-doc") didDoc = args[++i];
    else if (!a.startsWith("-") || a === "-") file = a;
  }
  if (!file) return null;
  return { file, quiet, verify: verifyFlag, didDoc };
}

export async function validate(args: string[]): Promise<number> {
  const opts = parseArgs(args);
  if (!opts) {
    console.error("Usage: daena validate <file> [--verify] [--did-doc <path>]");
    console.error("       cat file.json | daena validate -");
    return 2;
  }

  const label = opts.file === "-" ? "stdin" : opts.file;
  const raw =
    opts.file === "-" ? await readStdin() : readFileSync(opts.file, "utf8");

  // Schema validation
  let doc;
  try {
    doc = parse(raw);
  } catch (e) {
    if (e instanceof DaenaParseError) {
      console.error(`${red("✗")} ${bold(label)} is not a valid Daena document`);
      console.error("");
      for (const issue of e.issues) {
        console.error(`  ${red("✗")} ${issue.path}: ${issue.message}`);
      }
      return 1;
    }
    if (e instanceof SyntaxError) {
      console.error(`${red("✗")} ${bold(label)} is not valid JSON`);
      console.error(`  ${red("✗")} ${e.message}`);
      return 1;
    }
    throw e;
  }

  if (!opts.verify) {
    // Schema-only path
    if (opts.quiet) return 0;
    printSummary(label, doc, "schema");
    return 0;
  }

  // Signature verification
  const resolver = await buildResolver(opts.didDoc);
  if (!resolver.ok) return resolver.code;

  const result = await verify(doc, { resolver: resolver.value });
  if (!result.valid) {
    console.error(`${green("✓")} ${bold(label)} is a schema-valid Daena document`);
    console.error(`${red("✗")} Signature does not verify`);
    console.error("");
    for (const issue of result.issues) {
      console.error(`  ${red("✗")} ${issue.path}: ${issue.message}`);
    }
    if (!opts.didDoc && result.issues.some((i) => i.path === "publisher")) {
      console.error("");
      console.error(dim("Tip: pass --did-doc <path> to verify against a local DID document."));
    }
    return 1;
  }

  if (opts.quiet) return 0;
  console.log(`${green("✓")} ${bold(label)} is a valid Daena document`);
  console.log(`${green("✓")} Signature verifies against ${dim(doc.signature.keyId)}`);
  console.log("");
  printFields(doc);
  return 0;
}

interface ResolverResult {
  ok: true;
  value: DIDResolver;
}
interface ResolverError {
  ok: false;
  code: number;
}

async function buildResolver(didDocPath: string | undefined): Promise<ResolverResult | ResolverError> {
  if (!didDocPath) {
    return { ok: true, value: new WebDIDResolver() };
  }
  let didDoc: DIDDocument;
  try {
    const raw = readFileSync(didDocPath, "utf8");
    didDoc = JSON.parse(raw) as DIDDocument;
  } catch (e) {
    console.error(`${red("✗")} Could not load DID document from ${didDocPath}: ${e instanceof Error ? e.message : String(e)}`);
    return { ok: false, code: 1 };
  }
  if (!didDoc.id) {
    console.error(`${red("✗")} ${didDocPath} is not a valid DID document (missing 'id' field)`);
    return { ok: false, code: 1 };
  }
  return { ok: true, value: new StaticDIDResolver({ [didDoc.id]: didDoc }) };
}

function printSummary(label: string, doc: import("@daena/core").DaenaDocument, mode: "schema" | "verified"): void {
  console.log(`${green("✓")} ${bold(label)} is a valid Daena document${mode === "verified" ? " (verified)" : ""}`);
  console.log("");
  printFields(doc);
}

function printFields(doc: import("@daena/core").DaenaDocument): void {
  console.log(`  ${dim("publisher")}     ${doc.publisher}`);
  console.log(
    `  ${dim("facts")}         ${doc.facts.length}  (${doc.facts.map((f) => f.id).join(", ")})`
  );
  console.log(
    `  ${dim("capabilities")}  ${doc.capabilities.length}${doc.capabilities.length ? `  (${doc.capabilities.map((c) => c.id).join(", ")})` : ""}`
  );
  console.log(`  ${dim("version")}       ${doc.daena}`);
}
