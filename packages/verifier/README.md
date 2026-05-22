# @daena/verifier

Signature verification and identity resolution for the Daena Protocol.

Given a Daena document, this package:

- Resolves the publisher's DID to their current signing keys
- Verifies every signature in the document
- Reports tampering, expired keys, and revocation state

This is the structural anti-hallucination layer. Agents that trust unverified Daena documents are no better than agents scraping HTML. Always verify.

## Status

Pre-alpha.

## License

[Apache-2.0](../../LICENSE).
