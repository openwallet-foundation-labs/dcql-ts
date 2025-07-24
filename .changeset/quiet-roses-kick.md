---
"dcql": minor
---

feat: support multiple values for trusted authority of a credential. For example 'aki' trusted authority must match one of the hashes of the credential x509 chain, meaning multiple values could be provided for a single credential. Therefore values is now always an array, even though most (e.g. openid_federation) will only be bound to a single value.
