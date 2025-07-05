---
"dcql": minor
---

refactor of the whole structure returned by this library. It is a breaking change, but splits up all the checks into separate groups, including meta (vct, doctype, credential format, etc..), trusted authorities, and claims matching. It also includes detailed context on exactly which claims succeeded/failed, allowing for more control and insights into why a query did or didn't match
