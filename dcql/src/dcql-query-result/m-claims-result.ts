import * as v from 'valibot'

import { DcqlMdocCredential, DcqlSdJwtVcCredential, DcqlW3cVcCredential } from '../u-dcql-credential.js'
import { vIdString, vNonEmptyArray } from '../u-dcql.js'

export namespace DcqlClaimsResult {
  const vClaimsOutput = v.union([
    DcqlMdocCredential.vModel.entries.namespaces,
    DcqlSdJwtVcCredential.vModel.entries.claims,
    DcqlW3cVcCredential.vModel.entries.claims,
  ])
  export const vClaimsEntrySuccessResult = v.object({
    success: v.literal(true),
    claim_index: v.number(),
    claim_id: v.optional(vIdString),
    output: vClaimsOutput,
  })

  export const vClaimsEntryFailureResult = v.object({
    success: v.literal(false),
    claim_index: v.number(),
    claim_id: v.optional(vIdString),

    issues: v.record(v.string(), v.unknown()),

    output: v.unknown(),
  })

  export const vClaimSetSuccessResult = v.object({
    success: v.literal(true),

    // Undefined in case of no claim set
    claim_set_index: v.union([v.number(), v.undefined()]),

    // We use indexes because if there are no claim sets, the ids can be undefined
    // Can be empty array in case there are no claims
    valid_claim_indexes: v.array(v.number()),
    failed_claim_indexes: v.optional(v.undefined()),
    output: vClaimsOutput,
  })

  export const vClaimSetFailureResult = v.object({
    success: v.literal(false),

    // Undefined in case of no claim set
    claim_set_index: v.union([v.number(), v.undefined()]),

    // We use indexes because if there are no claim sets, the ids can be undefined
    valid_claim_indexes: v.array(v.number()),
    failed_claim_indexes: vNonEmptyArray(v.number()),

    issues: v.record(v.string(), v.unknown()),
  })

  export const vClaimsSuccessResult = v.object({
    success: v.literal(true),
    valid_claims: v.array(vClaimsEntrySuccessResult),
    failed_claims: v.array(vClaimsEntryFailureResult),

    valid_claim_sets: vNonEmptyArray(vClaimSetSuccessResult),
    failed_claim_sets: v.array(vClaimSetFailureResult),
  })

  export const vClaimsFailureResult = v.object({
    success: v.literal(false),
    valid_claims: v.array(vClaimsEntrySuccessResult),
    failed_claims: vNonEmptyArray(vClaimsEntryFailureResult),

    valid_claim_sets: v.optional(v.undefined()),
    failed_claim_sets: vNonEmptyArray(vClaimSetFailureResult),
  })

  export const vModel = v.union([vClaimsSuccessResult, vClaimsFailureResult])
  export type Input = v.InferInput<typeof vModel>
  export type Output = v.InferOutput<typeof vModel>
}
export type DcqlClaimsResult = DcqlClaimsResult.Output
