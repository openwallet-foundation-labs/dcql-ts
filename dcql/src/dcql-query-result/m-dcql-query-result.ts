import * as v from 'valibot'
import { DcqlCredentialQuery } from '../dcql-query/m-dcql-credential-query.js'
import { CredentialSetQuery } from '../dcql-query/m-dcql-credential-set-query.js'
import { vIdString, vNonEmptyArray } from '../u-dcql.js'
import { DcqlClaimsResult } from './m-claims-result.js'
import { DcqlMetaResult } from './m-meta-result.js'
import { DcqlTrustedAuthoritiesResult } from './m-trusted-authorities-result.js'

export namespace DcqlQueryResult {
  export const vCredentialQueryItemCredentialSuccessResult = v.object({
    success: v.literal(true),
    input_credential_index: v.number(),
    trusted_authorities: DcqlTrustedAuthoritiesResult.vTrustedAuthoritySuccessResult,

    // TODO: format specific (we should probably add format to this object, to differentiate?)
    claims: DcqlClaimsResult.vClaimsSuccessResult,
    meta: DcqlMetaResult.vMetaSuccessResult,
  })

  export const vCredentialQueryItemCredentialFailureResult = v.object({
    success: v.literal(false),
    input_credential_index: v.number(),
    trusted_authorities: DcqlTrustedAuthoritiesResult.vModel,
    claims: DcqlClaimsResult.vModel,
    meta: DcqlMetaResult.vModel,
  })

  export const vCredentialQueryItemResult = v.union([
    v.object({
      success: v.literal(true),
      credential_query_id: vIdString,
      valid_credentials: vNonEmptyArray(vCredentialQueryItemCredentialSuccessResult),
      failed_credentials: v.array(vCredentialQueryItemCredentialFailureResult),
    }),
    v.object({
      success: v.literal(false),
      credential_query_id: vIdString,
      valid_credentials: v.optional(v.undefined()),
      failed_credentials: vNonEmptyArray(vCredentialQueryItemCredentialFailureResult),
    }),
  ])

  export const vCredentialQueryResult = v.record(vIdString, vCredentialQueryItemResult)

  export type CredentialQueryResult = v.InferOutput<typeof vCredentialQueryResult>
  export type CredentialQueryItemResult = v.InferOutput<typeof vCredentialQueryItemResult>
  export type CredentialQueryItemCredentialSuccessResult = v.InferOutput<
    typeof vCredentialQueryItemCredentialSuccessResult
  >
  export type CredentialQueryItemCredentialFailureResult = v.InferOutput<
    typeof vCredentialQueryItemCredentialFailureResult
  >

  export const vModel = v.object({
    credentials: v.pipe(
      vNonEmptyArray(DcqlCredentialQuery.vModel),
      v.description(
        'REQUIRED. A non-empty array of Credential Queries that specify the requested Verifiable Credentials.'
      )
    ),

    credential_matches: vCredentialQueryResult,

    credential_sets: v.optional(
      v.pipe(
        vNonEmptyArray(
          v.object({
            ...CredentialSetQuery.vModel.entries,
            matching_options: v.union([v.undefined(), vNonEmptyArray(v.array(v.string()))]),
          })
        ),
        v.description(
          'OPTIONAL. A non-empty array of credential set queries that specifies additional constraints on which of the requested Verifiable Credentials to return.'
        )
      )
    ),

    can_be_satisfied: v.boolean(),
  })
  export type Input = v.InferInput<typeof vModel>
  export type Output = v.InferOutput<typeof vModel>

  export type CredentialMatch = Input['credential_matches'][number]
  export type CredentialMatchRecord = Input['credential_matches']
}
export type DcqlQueryResult = DcqlQueryResult.Output
