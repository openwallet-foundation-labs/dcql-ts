# dcql

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
