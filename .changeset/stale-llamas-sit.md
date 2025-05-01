---
"dcql": minor
---

feat: add support for w3c credentials with the `ldp_vc` and `jwt_vc_json` formats. 

W3C credentials were already partly supported, but the OpenID4VP specification did not have a clear
definition yet for DCQL with W3C VCs. We changed the format `jwt_vc_json-ld` to `ldp_vc` and added support
for `meta.type_values` for W3C credential queries.
