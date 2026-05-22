import { readFileSync, writeFileSync } from "node:fs";
import { parse, DaenaParseError } from "@daena/core";
import { render as renderHtml } from "@daena/renderer";
import { bold, dim, green, red } from "../ansi.js";
import { readStdin } from "../stdin.js";

interface RenderOptions {
  file: string;
  output?: string;
}

function parseArgs(args: string[]): RenderOptions | null {
  let file: string | null = null;
  let output: string | undefined;
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "--output" || a === "-o") {
      output = args[++i];
    } else if (!a.startsWith("-") || a === "-") {
      file = a;
    }
  }
  if (!file) return null;
  return { file, output };
}

export async function render(args: string[]): Promise<number> {
  const opts = parseArgs(args);
  if (!opts) {
    console.error("Usage: daena render <file> [--output <path>]");
    console.error("       cat file.json | daena render - --output index.html");
    return 2;
  }

  const label = opts.file === "-" ? "stdin" : opts.file;
  const raw =
    opts.file === "-" ? await readStdin() : readFileSync(opts.file, "utf8");

  let doc;
  try {
    doc = parse(raw);
  } catch (e) {
    if (e instanceof DaenaParseError) {
      console.error(
        `${red("✗")} Cannot render — ${bold(label)} is not a valid Daena document:`
      );
      for (const issue of e.issues) {
        console.error(`  ${red("✗")} ${issue.path}: ${issue.message}`);
      }
      return 1;
    }
    if (e instanceof SyntaxError) {
      console.error(`${red("✗")} ${bold(label)} is not valid JSON: ${e.message}`);
      return 1;
    }
    throw e;
  }

  const html = renderHtml(doc);

  if (opts.output) {
    writeFileSync(opts.output, html, "utf8");
    // Status message goes to stderr so stdout stays clean for piping.
    console.error(
      `${green("✓")} Rendered to ${bold(opts.output)} ${dim(`(${html.length} bytes)`)}`
    );
  } else {
    process.stdout.write(html);
  }

  return 0;
}
