---
"dcql": minor
---

feat: add support for 'require_cryptographic_holder_binding' parameter.

Each presentation passed to the `DcqlPresentationResult.fromDcqlPresentation` method, and each credential passed to the `DcqlQuery.query` method, must now include a `cryptographic_holder_binding` boolean property. Both will be checked against the DCQL query to ensure cryptographic holder binding is supported and present when required.
