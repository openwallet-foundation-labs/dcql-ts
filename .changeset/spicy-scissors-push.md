---
"dcql": minor
---

refactor: always return `undefined` or a non-empty array for claims, credentials, trusted authorities, etc. This provides more consistency for the different places in the library where arrays are returned. If the value is defined, you can now always be sure there's at least one item in the array
