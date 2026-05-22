import { existsSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { bold, dim, green } from "../ansi.js";

interface InitOptions {
  output: string;
  publisher: string;
  title: string;
  force: boolean;
}

function parseArgs(args: string[]): InitOptions {
  const opts: InitOptions = {
    output: "daena.json",
    publisher: "did:web:example.com",
    title: "Example Co.",
    force: false
  };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    switch (a) {
      case "--output":
      case "-o":
        opts.output = args[++i] ?? opts.output;
        break;
      case "--publisher":
      case "-p":
        opts.publisher = args[++i] ?? opts.publisher;
        break;
      case "--title":
      case "-t":
        opts.title = args[++i] ?? opts.title;
        break;
      case "--force":
      case "-f":
        opts.force = true;
        break;
    }
  }
  return opts;
}

export async function init(args: string[]): Promise<number> {
  const opts = parseArgs(args);
  const outputPath = resolve(process.cwd(), opts.output);

  if (existsSync(outputPath) && !opts.force) {
    console.error(
      `daena: ${opts.output} already exists. Use --force to overwrite.`
    );
    return 1;
  }

  const today = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
  const doc = {
    daena: "0",
    publisher: opts.publisher,
    facts: [
      {
        id: "name",
        type: "https://daena.org/vocab/business/name",
        value: opts.title,
        asOf: today
      }
    ],
    capabilities: [],
    render: {
      title: opts.title
    },
    signature: {
      algorithm: "ed25519",
      value: "PLACEHOLDER_SIGNATURE_BASE64",
      keyId: `${opts.publisher}#key-1`
    }
  };

  writeFileSync(outputPath, JSON.stringify(doc, null, 2) + "\n", "utf8");

  console.log(`${green("✓")} Created ${bold(opts.output)}`);
  console.log("");
  console.log("Next steps:");
  console.log(
    `  ${dim("1.")} Edit ${opts.output} — add facts, capabilities, render hints`
  );
  console.log(`  ${dim("2.")} Validate with:  daena validate ${opts.output}`);
  console.log(
    `  ${dim("3.")} Render with:    daena render ${opts.output} --output index.html`
  );
  console.log("");
  console.log(
    dim(
      "Note: the signature is a placeholder. Real publishers will sign with @daena/verifier (coming soon)."
    )
  );

  return 0;
}
