---
"dcql": minor
---

refactor: passing an empty credential array to the dcql library will now return an normal result with `valid_credentials` and `failed_credentials` being `undefined` for all credentials from the DCQL query. This to still allow using the context of the DCQL query result to build the UI for a request.
