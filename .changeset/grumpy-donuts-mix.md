---
"dcql": minor
---

feat: add support for 'require_cryptographic_holder_binding' parameter.

Each presentation passed to the `DcqlPresentationResult.fromDcqlPresentation` must now include a `includes_cryptographic_holder_binding` property. This will be checked against the DCQL query to ensure cryptographic holder binding is present when required.
