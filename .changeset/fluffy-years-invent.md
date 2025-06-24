---
"dcql": minor
---

feat: add support for the 'multiple' parameter in a DCQL query.

When the 'multipe' keyword is present (which is 'false' by default) a presentation can have multiple credentials.
It is still required for all presentations submitted to match against the query they are submitted to, even in the case
of 'multiple' and there is already a valid match, as well as if a credential set is optional.