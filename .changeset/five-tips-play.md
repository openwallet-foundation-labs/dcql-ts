---
"dcql": minor
---

feat: add support for 'trusted_authorities' in DCQL query.

If 'trusted_authorities' is present in the query, the provided credential MUST have an 'authority' matching one of
the trusted authorities from the query.
