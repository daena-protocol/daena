import { VERSION } from "./version.js";
import { bold, dim } from "./ansi.js";

export function showHelp(): void {
  console.log(`
${bold("daena")} ${dim(`v${VERSION}`)} — command-line tools for the Daena Protocol

${bold("Usage:")}
  daena <command> [options]

${bold("Commands:")}
  ${bold("init")}        Scaffold a new Daena document
  ${bold("keygen")}      Generate an ed25519 keypair (and optionally a DID document)
  ${bold("sign")}        Sign a Daena document with a stored private key
  ${bold("validate")}    Validate a Daena document (optionally verify signature)
  ${bold("render")}      Render a Daena document to HTML

${bold("init options:")}
  -o, --output <path>      Output path (default: daena.json)
  -p, --publisher <did>    Publisher DID (default: did:web:example.com)
  -t, --title <name>       Display title (default: Example Co.)
  -f, --force              Overwrite if file exists

${bold("keygen options:")}
  -o, --output <path>      Key file path (default: daena.key, chmod 600)
  -d, --did <did>          Your DID (default: did:web:example.com)
  -k, --key-id <name>      Key fragment (default: key-1)
      --did-doc-output <path>  Also write a ready-to-host DID document
  -f, --force              Overwrite if files exist

${bold("sign options:")}
  -k, --key <path>         Key file (default: daena.key)
      --key-id <did-url>   Override the keyId (default: from document)
  -o, --output <path>      Output path (default: overwrite input)

${bold("validate options:")}
  -q, --quiet              Suppress success output (exit code only)
      --verify             Verify the document's signature
      --did-doc <path>     Use a local DID document instead of fetching it

${bold("render options:")}
  -o, --output <path>      Write HTML to file (default: stdout)

${bold("Common options:")}
  -h, --help               Show help
  -v, --version            Show version

${bold("Quickstart — sign your first Daena document locally:")}
  daena init --publisher did:web:example.com --title "Example Co."
  daena keygen --did did:web:example.com --did-doc-output did.json
  daena sign daena.json
  daena validate --verify daena.json --did-doc did.json

Learn more at ${dim("https://daena-protocol.org")}
`);
}

export function showVersion(): void {
  console.log(VERSION);
}
