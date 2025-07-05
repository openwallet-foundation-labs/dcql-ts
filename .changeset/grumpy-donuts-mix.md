---
"dcql": minor
---

feat: add support for 'require_cryptographic_holder_binding' parameter.

Each presentation passed to the `DcqlPresentationResult.fromDcqlPresentation` method must now include a `includes_cryptographic_holder_binding` property. Each credential passed to the `DcqlQuery.query` method must now include a `supports_cryptographic_holder_binding`. Both will be checked against the DCQL query to ensure cryptographic holder binding is supported and present when required.
