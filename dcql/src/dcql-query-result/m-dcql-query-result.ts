import * as v from 'valibot'
import { DcqlCredentialQuery } from '../dcql-query/m-dcql-credential-query.js'
import { CredentialSetQuery } from '../dcql-query/m-dcql-credential-set-query.js'
import { DcqlCredential } from '../u-dcql-credential.js'
import { vIdString, vNonEmptyArray } from '../u-dcql.js'

export namespace DcqlQueryResult {
  export const vCredentialQueryResult = vNonEmptyArray(
    v.array(v.union([v.undefined(), DcqlCredential.vParseSuccess, DcqlCredential.vParseFailure]))
  )

  export type CredentialQueryResult = v.InferOutput<typeof vCredentialQueryResult>

  export const vModel = v.object({
    credentials: v.pipe(
      vNonEmptyArray(DcqlCredentialQuery.vModel),
      v.description(
        'REQUIRED. A non-empty array of Credential Queries that specify the requested Verifiable Credentials.'
      )
    ),

    credential_matches: v.record(
      v.pipe(vIdString),
      v.union([
        v.object({
          ...DcqlCredential.vParseSuccess.entries,
          all: vNonEmptyArray(
            vNonEmptyArray(v.union([v.undefined(), DcqlCredential.vParseSuccess, DcqlCredential.vParseFailure]))
          ),
        }),
        v.object({
          success: DcqlCredential.vParseFailure.entries.success,
          all: vNonEmptyArray(
            vNonEmptyArray(v.union([v.undefined(), DcqlCredential.vParseSuccess, DcqlCredential.vParseFailure]))
          ),
        }),
      ])
    ),

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

    canBeSatisfied: v.boolean(),
  })
  export type Input = v.InferInput<typeof vModel>
  export type Output = v.InferOutput<typeof vModel>

  export type CredentialMatch = Input['credential_matches'][number]
  export type CredentialMatchRecord = Input['credential_matches']
}
export type DcqlQueryResult = DcqlQueryResult.Output
