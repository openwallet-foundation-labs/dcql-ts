# dcql

## 2.0.1
### Patch Changes

- 04c7029: Fix the CommonJS entry point and the types file reference in `package.json`.

## 2.0.0
### Major Changes

- 4ef6fc8: Add support for W3C VCDM 2.0 SD-JWT format.

### Minor Changes

- 8e29ab5: chore: update valibot to 1.1.0

### Patch Changes

- 0ab60c1: Fix querying a W3C `vc+sd-jwt` credential.

## 1.0.1
### Patch Changes

- 29c0b04: fix: rename Model class to ModelDefinition to prevent naming clash in ESM generated typescript types

## 1.0.0
### Major Changes

- 4d6aab5: bump version to 1.0 stable

## 0.5.1
### Patch Changes

- 9db1273: ci: add git tag for package publishing
- 3f12360: ci: typo and git tag creation

## 0.5.0

### Minor Changes

- d6db07d: feat: support multiple values for trusted authority of a credential. For example 'aki' trusted authority must match one of the hashes of the credential x509 chain, meaning multiple values could be provided for a single credential. Therefore values is now always an array, even though most (e.g. openid_federation) will only be bound to a single value.
- fe2beaa: refactor: always return `undefined` or a non-empty array for claims, credentials, trusted authorities, etc. This provides more consistency for the different places in the library where arrays are returned. If the value is defined, you can now always be sure there's at least one item in the array
- fe2beaa: refactor: passing an empty credential array to the dcql library will now return an normal result with `valid_credentials` and `failed_credentials` being `undefined` for all credentials from the DCQL query. This to still allow using the context of the DCQL query result to build the UI for a request.

## 0.4.2

### Patch Changes

- 0866100: refactor: update message for cryptographic holder binding for clarity

## 0.4.1

### Patch Changes

- 0916622: fix: do not include claim indexes not applicable for the current claim_set

## 0.4.0

### Minor Changes

- 2816b2d: feat: add support for the 'multiple' parameter in a DCQL query.

  When the 'multipe' keyword is present (which is 'false' by default) a presentation can have multiple credentials.
  It is still required for all presentations submitted to match against the query they are submitted to, even in the case
  of 'multiple' and there is already a valid match, as well as if a credential set is optional.

- b05782b: feat: add support for 'require_cryptographic_holder_binding' parameter.

  Each presentation passed to the `DcqlPresentationResult.fromDcqlPresentation` method, and each credential passed to the `DcqlQuery.query` method, must now include a `cryptographic_holder_binding` boolean property. Both will be checked against the DCQL query to ensure cryptographic holder binding is supported and present when required.

- 2816b2d: refactor: rename canBeSatisfied to can_be_satisfied for casing consistency
- 2816b2d: refactor of the whole structure returned by this library. It is a breaking change, but splits up all the checks into separate groups, including meta (vct, doctype, credential format, etc..), trusted authorities, and claims matching. It also includes detailed context on exactly which claims succeeded/failed, allowing for more control and insights into why a query did or didn't match

## 0.3.0

### Minor Changes

- 75638ba: feat: add support for 'trusted_authorities' in DCQL query.

  If 'trusted_authorities' is present in the query, the provided credential MUST have an 'authority' matching one of
  the trusted authorities from the query.

- ec16ec3: feat: add support for w3c credentials with the `ldp_vc` and `jwt_vc_json` formats.

  W3C credentials were already partly supported, but the OpenID4VP specification did not have a clear
  definition yet for DCQL with W3C VCs. We changed the format `jwt_vc_json-ld` to `ldp_vc` and added support
  for `meta.type_values` for W3C credential queries.

## 0.2.22

### Patch Changes

- bb9a3ce: fix: issue where canBeSatisfied would be true when the presentation was missing credentials and no credential_sets were used

## 0.2.21

### Patch Changes

- 67cd3b2: fix: handle the case where multiple claim sets would be present for a credential within a query

## 0.2.20

### Patch Changes

- 95526ca: add support for `intent_to_retain` for `mso_mdoc` claims query
- c3bb052: support new `path` syntax for `mso_mdoc` credential queries from OID4VP Draft 24, in addition the `namespace` and `claim_name` syntax from OID4VP Draft 22/23

## 0.2.19

### Patch Changes

- 4baba71: chore: change tooling
