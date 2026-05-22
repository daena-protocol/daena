# Releasing

How to publish the Daena reference packages to npm.

## One-time setup (the maintainer does this once, ever)

1. **Create an npm account** if you don't have one: <https://www.npmjs.com/signup>.

2. **Claim the `@daena` scope.** From <https://www.npmjs.com/org/create>, create an organization named `daena`. Free tier is fine for public packages.

3. **Enable 2FA on your npm account** under Settings → Two-Factor Authentication. Use an authenticator app or a hardware key. npm enforces 2FA for organization owners and that's a good thing.

4. **Add yourself as the only owner of `@daena`** (default when you create the org).

5. **Authenticate locally:**

   ```bash
   npm login
   ```

   This stores a token in `~/.npmrc`. Anyone with that file can publish — keep it private.

## Publishing a release

The packages have a clear dependency graph:

```
@daena/core
   ├── @daena/verifier
   ├── @daena/renderer
   ├── @daena/sdk      (also depends on verifier)
   └── @daena/cli      (also depends on verifier + renderer)
```

Publish in dependency order. Each package's `prepublishOnly` script runs `tsup` first, so you don't have to build manually.

```bash
# From the daena repo root:
npm install
npm test                     # 68/68 should pass

# Publish in order — each takes ~2 seconds
cd packages/core      && npm publish && cd ../..
cd packages/verifier  && npm publish && cd ../..
cd packages/renderer  && npm publish && cd ../..
cd packages/sdk       && npm publish && cd ../..
cd packages/cli       && npm publish && cd ../..
```

After all five succeed, the CLI is installable from anywhere:

```bash
npm install -g @daena/cli
daena --help
```

## Bumping versions

The packages are kept in lockstep on a single shared version. To bump from `0.1.0-alpha.0` to (e.g.) `0.1.0-alpha.1`:

```bash
# At the repo root:
npm version --workspaces 0.1.0-alpha.1
# Also bump the inter-package dependency declarations to match:
#   In each package.json, "@daena/core": "0.1.0-alpha.1" etc.
```

A future PR could automate this with `changesets` or `release-please`; for now it's manual.

## Versioning conventions

- **`0.x.x-alpha.n`** — the current pre-alpha series. Breaking changes are expected at any minor or patch bump. **You are here.**
- **`0.x.x-beta.n`** — once the v0 spec is stable enough that public examples don't churn. Breaking changes still possible at minor bumps.
- **`0.x.x`** (no pre-release tag) — v0 spec frozen; future breaks gated to a major version.
- **`1.0.0`** — the protocol's v1 release. Backwards-incompatible changes require a `2.0.0`.

## Unpublishing

Don't. npm unpublish is heavily restricted (72-hour window, breaks downstream consumers, can leave the package name in a deprecated state). If a release is broken, publish a fixed version with a bumped number and add `npm deprecate "@daena/core@<broken-version>" "see <newer-version>"` to warn users.

## What to do if publishing fails

| Error | Fix |
|---|---|
| `403 Forbidden — Package name too similar to existing` | Someone else claimed a nearby name. Check the scope ownership on npmjs.com. |
| `402 Payment Required` | The package is scoped (`@daena/*`) and `publishConfig.access` is missing. It's set to `"public"` in every `package.json` here — double-check. |
| `Tag not authorized` | 2FA OTP needed. Run `npm publish --otp=123456` with a fresh code. |
| `Already published` | The version already exists. Bump and retry. |

## When the protocol moves

Daena Protocol v0 is pre-alpha. Spec changes mean breaking package changes. When that happens:

1. Update the spec under `daena-protocol/spec`
2. Update the reference implementation here to match
3. Bump every package to the next pre-release version
4. Publish in dependency order

Once the protocol is stable enough that publishers and agents in the wild care, switch to a proper changelog-driven release process (Changesets, semantic-release, or release-please). For pre-alpha, the manual cadence above is fine.
