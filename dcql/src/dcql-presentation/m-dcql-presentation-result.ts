import * as v from 'valibot'

import { DcqlInvalidPresentationRecordError, DcqlPresentationResultError } from '../dcql-error/e-dcql.js'
import { runCredentialQuery } from '../dcql-parser/dcql-credential-query-result.js'
import { DcqlQueryResult } from '../dcql-query-result/m-dcql-query-result.js'
import type { DcqlQuery } from '../dcql-query/m-dcql-query.js'
import { DcqlCredential } from '../u-dcql-credential.js'
import { vIdString } from '../u-dcql.js'
import type { DcqlCredentialPresentation } from './m-dcql-credential-presentation.js'

export namespace DcqlPresentationResult {
  export const vModel = v.object({
    ...v.omit(DcqlQueryResult.vModel, ['credential_matches']).entries,

    invalid_matches: v.union([
      v.record(
        v.pipe(vIdString),
        v.object({
          ...v.omit(DcqlCredential.vParseFailure, ['input_credential_index']).entries,
          presentation_id: v.pipe(vIdString),
        })
      ),
      v.undefined(),
    ]),

    valid_matches: v.record(
      v.pipe(vIdString),
      v.object({
        ...v.omit(DcqlCredential.vParseSuccess, ['issues', 'input_credential_index']).entries,
        presentation_id: v.pipe(vIdString),
      })
    ),
  })

  export type Input = v.InferInput<typeof vModel>
  export type Output = v.InferOutput<typeof vModel>

  export const parse = (input: Input | DcqlQueryResult) => {
    return v.parse(vModel, input)
  }

  /**
   * Query if the presentation record can be satisfied by the provided presentations
   * considering the dcql query
   *
   * @param dcqlQuery
   * @param dcqlPresentation
   */
  export const fromDcqlPresentation = (
    dcqlPresentation: Record<string, DcqlCredentialPresentation>,
    ctx: { dcqlQuery: DcqlQuery }
  ): Output => {
    const { dcqlQuery } = ctx

    const presentationQueriesResults = Object.fromEntries(
      Object.entries(dcqlPresentation).map(([queryId, presentation]) => {
        const credentialQuery = dcqlQuery.credentials.find((c) => c.id === queryId)
        if (!credentialQuery) {
          throw new DcqlPresentationResultError({
            message: `Query ${queryId} not found in the dcql query. Cannot validate presentation.`,
          })
        }

        return [
          queryId,
          runCredentialQuery(credentialQuery, {
            presentation: true,
            credentials: [presentation],
          }),
        ]
      })
    )

    let invalidMatches: DcqlPresentationResult['invalid_matches'] = {}
    const validMatches: DcqlPresentationResult['valid_matches'] = {}

    for (const [queryId, presentationQueryResult] of Object.entries(presentationQueriesResults)) {
      for (const presentationQueryResultForClaimSet of presentationQueryResult) {
        // NOTE: result can be undefined, but this is only the case if there was a valid claim
        // set match previously and we skip other claim set matching. We don't add these to the parse
        // result.
        const result = presentationQueryResultForClaimSet[0]

        if (result?.success) {
          const { issues, input_credential_index, ...rest } = result
          validMatches[queryId] = { ...rest, presentation_id: queryId }
        } else if (result?.success === false) {
          const { input_credential_index, ...rest } = result
          invalidMatches[queryId] = {
            ...rest,
            presentation_id: queryId,
          }
        }
      }
    }

    // Only keep the invalid matches that do not have a valid match as well
    invalidMatches = Object.fromEntries(
      Object.entries(invalidMatches ?? {}).filter(([queryId, result]) => validMatches[queryId] === undefined)
    )

    const credentialSetResults = dcqlQuery.credential_sets?.map((set) => {
      const matchingOptions = set.options.filter((option) =>
        option.every((credentialQueryId) => validMatches[credentialQueryId]?.success)
      )

      return {
        ...set,
        matching_options: matchingOptions.length > 0 ? (matchingOptions as [string[], ...string[][]]) : undefined,
      }
    }) as DcqlQueryResult.Output['credential_sets']

    const dqclQueryMatched = credentialSetResults
      ? credentialSetResults.every((set) => !set.required || set.matching_options)
      : Object.keys(invalidMatches).length === 0

    return {
      ...dcqlQuery,
      canBeSatisfied: dqclQueryMatched,
      valid_matches: validMatches,
      invalid_matches: Object.keys(invalidMatches).length === 0 ? undefined : {},
      credential_sets: credentialSetResults,
    }
  }

  export const validate = (dcqlQueryResult: DcqlPresentationResult) => {
    if (!dcqlQueryResult.canBeSatisfied) {
      throw new DcqlInvalidPresentationRecordError({
        message: 'Invalid Presentation record',
        cause: dcqlQueryResult,
      })
    }

    return dcqlQueryResult satisfies Output
  }
}
export type DcqlPresentationResult = DcqlPresentationResult.Output
