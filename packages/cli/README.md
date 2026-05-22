# @daena/cli

The `daena` command-line tool.

```bash
npm install -g @daena/cli
```

## Commands

| Command | Purpose |
|---|---|
| `daena init` | Scaffold a new Daena document |
| `daena keygen` | Generate an ed25519 keypair (and optionally a DID document) |
| `daena sign <file>` | Sign a Daena document with a stored private key |
| `daena validate <file>` | Validate a document; optionally verify its signature |
| `daena render <file>` | Render a Daena document to HTML |

Run `daena --help` for the full option surface.

## End-to-end quickstart (offline)

```bash
# 1. Scaffold a document
daena init --publisher did:web:example.com --title "Example Co."

# 2. Generate an ed25519 keypair and a matching DID document
daena keygen --did did:web:example.com --did-doc-output did.json

# 3. Sign the document with that key
daena sign daena.json

# 4. Verify it against the local DID document (no network needed)
daena validate --verify daena.json --did-doc did.json

# 5. Render the human view
daena render daena.json --output index.html
open index.html
```

## Online verification

If you've published `did.json` at `https://example.com/.well-known/did.json`,
agents and the CLI can verify signatures over the network without a local copy:

```bash
daena validate --verify daena.json
```

## Piping

All file arguments accept `-` to read from stdin. `render` writes HTML to stdout by default (status messages go to stderr), so commands chain cleanly:

```bash
curl https://example.com/daena.json | daena validate -
curl https://example.com/daena.json | daena render - | gzip > page.html.gz
```

## Exit codes

- `0` — success
- `1` — validation, verification, or runtime error
- `2` — usage error (missing arguments)

## Security

The `keygen` command writes the private key with `chmod 600` so other users on the same machine can't read it. The file is plain JSON containing a base64-encoded ed25519 seed — keep it secret. Anyone who reads it can sign as you.

## Status

Pre-alpha. Tracks the [Daena Protocol v0 editor's draft](https://github.com/daena-protocol/spec/blob/main/SPEC.md).

## License

[Apache-2.0](../../LICENSE).
