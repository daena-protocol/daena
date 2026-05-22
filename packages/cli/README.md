# @daena/cli

The `daena` command-line tool.

```bash
npm install -g @daena/cli
```

## Commands

| Command | Purpose |
|---|---|
| `daena init` | Scaffold a Daena document for the current project |
| `daena validate <file>` | Validate a Daena document against the spec |
| `daena sign <file>` | Sign a Daena document with your publisher identity |
| `daena publish <file>` | Sign and serve a Daena document |
| `daena verify <url-or-file>` | Verify the signatures on a Daena document |

*The above is the target command surface. Subcommands are landing incrementally.*

## Status

Pre-alpha.

## License

[Apache-2.0](../../LICENSE).
