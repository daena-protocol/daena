import { VERSION } from "./version.js";
import { bold, dim } from "./ansi.js";

export function showHelp(): void {
  console.log(`
${bold("daena")} ${dim(`v${VERSION}`)} — command-line tools for the Daena Protocol

${bold("Usage:")}
  daena <command> [options]

${bold("Commands:")}
  ${bold("init")}        Scaffold a new Daena document
  ${bold("validate")}    Validate a Daena document against the spec
  ${bold("render")}      Render a Daena document to HTML

${bold("Init options:")}
  -o, --output <path>      Output path (default: daena.json)
  -p, --publisher <did>    Publisher DID (default: did:web:example.com)
  -t, --title <name>       Display title (default: Example Co.)
  -f, --force              Overwrite if file exists

${bold("Validate options:")}
  -q, --quiet              Suppress success output (exit code only)

${bold("Render options:")}
  -o, --output <path>      Write HTML to file (default: stdout)

${bold("Common options:")}
  -h, --help               Show help
  -v, --version            Show version

${bold("Examples:")}
  daena init --publisher did:web:example.com
  daena validate ./daena.json
  daena render ./daena.json --output index.html
  cat daena.json | daena validate -

Learn more at ${dim("https://daena.org")}
`);
}

export function showVersion(): void {
  console.log(VERSION);
}
