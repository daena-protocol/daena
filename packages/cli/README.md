# @daena/cli

The `daena` command-line tool.

```bash
npm install -g @daena/cli
```

## Commands

| Command | Purpose |
|---|---|
| `daena init` | Scaffold a new Daena document |
| `daena validate <file>` | Validate a Daena document against the spec |
| `daena render <file>` | Render a Daena document to HTML |

Run `daena --help` for full option documentation.

## Quickstart

```bash
# Create a starter document
daena init --publisher did:web:example.com --title "Example Co."

# Edit daena.json — add facts, capabilities, render hints

# Validate it
daena validate daena.json

# Render it to a webpage
daena render daena.json --output index.html
open index.html
```

## Piping

All file arguments accept `-` to read from stdin:

```bash
curl https://example.com/daena.json | daena validate -
curl https://example.com/daena.json | daena render - --output page.html
```

`render` writes HTML to stdout by default (status messages go to stderr), so you can chain:

```bash
daena render daena.json | gzip > page.html.gz
```

## Exit codes

- `0` — success
- `1` — validation or runtime error (invalid document, file conflict, etc.)
- `2` — usage error (missing arguments)

## Status

Pre-alpha. Tracks the [Daena Protocol v0 editor's draft](https://github.com/daena-protocol/spec/blob/main/SPEC.md).

## License

[Apache-2.0](../../LICENSE).
