# Daena — Reference Implementation

The reference SDK, CLI, renderer, and verifier for the [Daena Protocol](https://github.com/daena-protocol/spec).

This is a monorepo. Each package is independently versioned and published, but they live together so the reference implementation stays coherent against the specification.

## Packages

| Package | Purpose |
|---|---|
| [`@daena/core`](./packages/core) | Types, schema validation, document utilities |
| [`@daena/sdk`](./packages/sdk) | Publisher and agent SDK |
| [`@daena/cli`](./packages/cli) | `daena` command-line tool |
| [`@daena/renderer`](./packages/renderer) | Render Daena documents to HTML and other human views |
| [`@daena/verifier`](./packages/verifier) | Signature verification and identity resolution |

## Quickstart

```bash
# Install the CLI
npm install -g @daena/cli

# Initialize a Daena document for your project
daena init

# Publish it
daena publish ./daena.json

# Verify any Daena document
daena verify https://example.com/daena.json
```

*The above is the target developer experience. Packages are under active development; expect interfaces to change until v1.*

## Status

Pre-alpha. The protocol itself is in [Editor's Draft](https://github.com/daena-protocol/spec/blob/main/SPEC.md). This implementation tracks the draft.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) and the org-wide [Code of Conduct](https://github.com/daena-protocol/.github/blob/main/CODE_OF_CONDUCT.md).

## License

[Apache-2.0](./LICENSE).
