import { readFileSync } from "node:fs";
import { parse, DaenaParseError } from "@daena/core";
import { bold, dim, green, red } from "../ansi.js";
import { readStdin } from "../stdin.js";

interface ValidateOptions {
  file: string;
  quiet: boolean;
}

function parseArgs(args: string[]): ValidateOptions | null {
  let file: string | null = null;
  let quiet = false;
  for (const a of args) {
    if (a === "--quiet" || a === "-q") quiet = true;
    else if (!a.startsWith("-") || a === "-") file = a;
  }
  if (!file) return null;
  return { file, quiet };
}

export async function validate(args: string[]): Promise<number> {
  const opts = parseArgs(args);
  if (!opts) {
    console.error("Usage: daena validate <file>");
    console.error("       cat file.json | daena validate -");
    return 2;
  }

  const label = opts.file === "-" ? "stdin" : opts.file;
  const raw =
    opts.file === "-" ? await readStdin() : readFileSync(opts.file, "utf8");

  try {
    const doc = parse(raw);
    if (opts.quiet) return 0;
    console.log(
      `${green("✓")} ${bold(label)} is a valid Daena document`
    );
    console.log("");
    console.log(`  ${dim("publisher")}     ${doc.publisher}`);
    console.log(
      `  ${dim("facts")}         ${doc.facts.length}  (${doc.facts.map((f) => f.id).join(", ")})`
    );
    console.log(
      `  ${dim("capabilities")}  ${doc.capabilities.length}${doc.capabilities.length ? `  (${doc.capabilities.map((c) => c.id).join(", ")})` : ""}`
    );
    console.log(`  ${dim("version")}       ${doc.daena}`);
    return 0;
  } catch (e) {
    if (e instanceof DaenaParseError) {
      console.error(
        `${red("✗")} ${bold(label)} is not a valid Daena document`
      );
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
}
