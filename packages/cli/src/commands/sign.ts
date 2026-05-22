import { readFileSync, writeFileSync } from "node:fs";
import { parse, DaenaParseError } from "@daena/core";
import { sign as signDoc } from "@daena/verifier";
import { bold, dim, green, red } from "../ansi.js";
import { readKeyFile } from "../keyfile.js";

interface SignOptions {
  file: string;
  key: string;
  keyId?: string;
  output?: string;
}

function parseArgs(args: string[]): SignOptions | null {
  let file: string | null = null;
  let key = "daena.key";
  let keyId: string | undefined;
  let output: string | undefined;
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "--key" || a === "-k") key = args[++i] ?? key;
    else if (a === "--key-id") keyId = args[++i];
    else if (a === "--output" || a === "-o") output = args[++i];
    else if (!a.startsWith("-")) file = a;
  }
  if (!file) return null;
  return { file, key, keyId, output };
}

export async function sign(args: string[]): Promise<number> {
  const opts = parseArgs(args);
  if (!opts) {
    console.error("Usage: daena sign <file> [--key <keyfile>] [--key-id <did-url>] [--output <path>]");
    return 2;
  }

  // Parse the document (must be schema-valid before we sign).
  let doc;
  try {
    const raw = readFileSync(opts.file, "utf8");
    doc = parse(raw);
  } catch (e) {
    if (e instanceof DaenaParseError) {
      console.error(`${red("✗")} ${bold(opts.file)} is not a valid Daena document. Fix schema errors before signing.`);
      for (const issue of e.issues) {
        console.error(`  ${red("✗")} ${issue.path}: ${issue.message}`);
      }
      return 1;
    }
    console.error(`${red("✗")} Could not read ${opts.file}: ${e instanceof Error ? e.message : String(e)}`);
    return 1;
  }

  // Load the key file.
  let keyFile;
  try {
    keyFile = readKeyFile(opts.key);
  } catch (e) {
    console.error(`${red("✗")} ${e instanceof Error ? e.message : String(e)}`);
    return 1;
  }

  // Resolve keyId: explicit --key-id wins; otherwise use the existing
  // signature.keyId from the document.
  const keyId = opts.keyId ?? doc.signature.keyId;
  if (!keyId) {
    console.error(`${red("✗")} No --key-id specified and document has no existing signature.keyId.`);
    return 2;
  }

  const privateKey = Uint8Array.from(Buffer.from(keyFile.privateKey, "base64"));
  if (privateKey.length !== 32) {
    console.error(`${red("✗")} Key file ${opts.key} does not contain a 32-byte ed25519 seed.`);
    return 1;
  }

  // Sign — verifier.sign() strips any existing signature and adds a fresh one.
  const signed = signDoc(doc, { privateKey, keyId });

  const outputPath = opts.output ?? opts.file;
  writeFileSync(outputPath, JSON.stringify(signed, null, 2) + "\n", "utf8");

  const replaced = outputPath === opts.file;
  console.log(`${green("✓")} Signed ${bold(opts.file)} with key ${dim(keyId)}`);
  if (!replaced) {
    console.log(`${green("✓")} Wrote signed document to ${bold(outputPath)}`);
  }
  console.log("");
  console.log(`Verify with:`);
  console.log(`  daena validate --verify ${outputPath}`);
  console.log(dim(`  (use --did-doc <path> to verify against a local DID document)`));

  return 0;
}
