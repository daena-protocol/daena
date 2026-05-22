# Contributing to the Daena reference implementation

Thanks for your interest in helping build the Daena reference tools. This document covers the code-side workflow. For org-wide conventions, see the org [CONTRIBUTING.md](https://github.com/daena-protocol/.github/blob/main/CONTRIBUTING.md). For spec changes, see [the spec governance doc](https://github.com/daena-protocol/spec/blob/main/GOVERNANCE.md).

## Local setup

```bash
git clone https://github.com/daena-protocol/daena.git
cd daena
npm install
npm run build
npm test
```

You need Node.js 20 or newer.

## Workflow

- Branch from `main`. Use a descriptive name (`feat/sdk-act-verb`, `fix/cli-init-windows-path`).
- Keep PRs focused. Smaller, single-purpose PRs are merged faster.
- Add tests for new behavior. We aim for meaningful coverage, not 100%.
- Follow [Conventional Commits](https://www.conventionalcommits.org/) — `feat:`, `fix:`, `docs:`, `chore:`, `test:`.
- Run `npm run lint` before pushing.

## Reviews

At least one maintainer review is required before merge. CI must pass. `main` is protected.

## Releasing

Releases are cut from `main` using changesets. Maintainers handle releases; contributors do not need to bump versions.

## Code of conduct

See the org [Code of Conduct](https://github.com/daena-protocol/.github/blob/main/CODE_OF_CONDUCT.md).
