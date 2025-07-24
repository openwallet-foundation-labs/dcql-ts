import * as v from 'valibot'
import { DcqlCredentialTrustedAuthority } from '../dcql-query/m-dcql-trusted-authorities.js'
import { vNonEmptyArray } from '../u-dcql.js'

export namespace DcqlTrustedAuthoritiesResult {
  export const vTrustedAuthorityEntrySuccessResult = v.object({
    success: v.literal(true),
    trusted_authority_index: v.number(),

    // We map from values (multiple options for a credential/query) to value (the matching option)
    output: v.variant(
      'type',
      DcqlCredentialTrustedAuthority.vModel.options.map((o) =>
        v.object({
          type: o.entries.type,
          value: o.entries.values.item,
        })
      )
    ),
  })

  export const vTrustedAuthorityEntryFailureResult = v.object({
    success: v.literal(false),
    trusted_authority_index: v.number(),
    issues: v.record(v.string(), v.unknown()),
    output: v.unknown(),
  })

  export const vTrustedAuthoritySuccessResult = v.union([
    // In this case there is no trusted authority on the query
    v.object({
      success: v.literal(true),
      valid_trusted_authority: v.optional(v.undefined()),
      failed_trusted_authorities: v.optional(v.undefined()),
    }),
    v.object({
      success: v.literal(true),
      valid_trusted_authority: vTrustedAuthorityEntrySuccessResult,
      failed_trusted_authorities: v.optional(vNonEmptyArray(vTrustedAuthorityEntryFailureResult)),
    }),
  ])

  export const vTrustedAuthorityFailureResult = v.object({
    success: v.literal(false),
    valid_trusted_authority: v.optional(v.undefined()),
    failed_trusted_authorities: vNonEmptyArray(vTrustedAuthorityEntryFailureResult),
  })

  export const vModel = v.union([...vTrustedAuthoritySuccessResult.options, vTrustedAuthorityFailureResult])
  export type Input = v.InferInput<typeof vModel>
  export type Output = v.InferOutput<typeof vModel>
}
export type DcqlTrustedAuthoritiesResult = DcqlTrustedAuthoritiesResult.Output
