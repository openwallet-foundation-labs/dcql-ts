import * as v from 'valibot'

import { DcqlInvalidPresentationRecordError, DcqlPresentationResultError } from '../dcql-error/e-dcql.js'
import { runCredentialQuery } from '../dcql-parser/dcql-credential-query-result.js'
import { DcqlQueryResult } from '../dcql-query-result/m-dcql-query-result.js'
import type { DcqlQuery } from '../dcql-query/m-dcql-query.js'
import { DcqlCredential } from '../u-dcql-credential.js'
import { vIdString, vNonEmptyArray } from '../u-dcql.js'
import type { DcqlCredentialPresentation } from './m-dcql-credential-presentation.js'

export namespace DcqlPresentationResult {
  export const vModel = v.object({
    ...v.omit(DcqlQueryResult.vModel, ['credential_matches']).entries,

    invalid_matches: v.union([
      v.record(
        vIdString,
        vNonEmptyArray(
          v.object({
            ...v.omit(DcqlCredential.vParseFailure, ['input_credential_index']).entries,
            input_presentation_index: v.number(),
            presentation_id: vIdString,
          })
        )
      ),
      v.undefined(),
    ]),

    valid_matches: v.record(
      vIdString,
      vNonEmptyArray(
        v.object({
          ...v.omit(DcqlCredential.vParseSuccess, ['issues', 'input_credential_index']).entries,
          input_presentation_index: v.number(),
          presentation_id: vIdString,
        })
      )
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
    dcqlPresentation: Record<string, DcqlCredentialPresentation[]>,
    ctx: { dcqlQuery: DcqlQuery }
  ): Output => {
    const { dcqlQuery } = ctx

    const presentationQueriesResults = Object.fromEntries(
      Object.entries(dcqlPresentation).map(([queryId, presentations]) => {
        const credentialQuery = dcqlQuery.credentials.find((c) => c.id === queryId)
        if (!credentialQuery) {
          throw new DcqlPresentationResultError({
            message: `Query ${queryId} not found in the dcql query. Cannot validate presentation.`,
          })
        }

        if (presentations.length === 0) {
          throw new DcqlPresentationResultError({
            message: `Query credential '${queryId}' is present in the presentations but the value is an empty array. Each entry must at least provide one presentation.`,
          })
        }

        if (!credentialQuery.multiple && presentations.length > 1) {
          throw new DcqlPresentationResultError({
            message: `Query credential '${queryId}' has not enabled 'multiple', but multiple presentations were provided. Only a single presentation is allowed for each query credential when 'multiple' is not enabled on the query.`,
          })
        }

        return [
          queryId,
          runCredentialQuery(credentialQuery, {
            presentation: true,
            credentials: presentations,
          }),
        ]
      })
    )

    let invalidMatches: NonNullable<DcqlPresentationResult['invalid_matches']> = {}
    const validMatches: DcqlPresentationResult['valid_matches'] = {}

    for (const [queryId, presentationQueryResult] of Object.entries(presentationQueriesResults)) {
      for (const presentationQueryResultForClaimSet of presentationQueryResult) {
        // NOTE: result can be undefined, but this is only the case if there was a valid claim
        // set match previously and we skip other claim set matching. We don't add these to the parse
        // result.
        for (const result of presentationQueryResultForClaimSet)
          if (result?.success) {
            const { issues, input_credential_index: input_presentation_index, ...rest } = result

            if (!validMatches[queryId]) {
              validMatches[queryId] = [{ ...rest, presentation_id: queryId, input_presentation_index }]
            } else {
              validMatches[queryId].push({ ...rest, presentation_id: queryId, input_presentation_index })
            }
          } else if (result?.success === false) {
            const { input_credential_index: input_presentation_index, ...rest } = result

            if (!invalidMatches[queryId]) {
              invalidMatches[queryId] = [
                {
                  ...rest,
                  presentation_id: queryId,
                  input_presentation_index,
                },
              ]
            } else {
              invalidMatches[queryId].push({
                ...rest,
                presentation_id: queryId,
                input_presentation_index,
              })
            }
          }
      }
    }

    const credentialSetResults = dcqlQuery.credential_sets?.map((set) => {
      const matchingOptions = set.options.filter((option) =>
        option.every((credentialQueryId) => validMatches[credentialQueryId] !== undefined)
      )

      return {
        ...set,
        matching_options: matchingOptions.length > 0 ? (matchingOptions as [string[], ...string[][]]) : undefined,
      }
    }) as DcqlQueryResult.Output['credential_sets']

    // We only keep the invalid matches for credentials that don't have an entry in the valid matches
    // (taking into account that multiple credentials can be sumitted)
    invalidMatches = Object.fromEntries(
      Object.entries(invalidMatches)
        .map(([queryId, matchesForQueryId]) => {
          const validMatchesForQueryId = validMatches[queryId]
          if (!validMatchesForQueryId) return [queryId, matchesForQueryId]

          const satisfiedPresentationCredentialIndexes = validMatchesForQueryId.map(
            (index) => index.input_presentation_index
          )
          const filteredMatchesForQueryId = matchesForQueryId.filter(
            (match) => !satisfiedPresentationCredentialIndexes.includes(match.input_presentation_index)
          )
          if (filteredMatchesForQueryId.length === 0) return undefined

          return [queryId, filteredMatchesForQueryId]
        })
        .filter((entry): entry is NonNullable<typeof entry> => entry !== undefined)
    )

    const dqclQueryMatched =
      // We already filter the matches above for each credential type
      // So if we still have invalid matches, it means 'multiple' was used
      // and not all presentations satisfy the query
      Object.keys(invalidMatches).length === 0 &&
      (credentialSetResults
        ? credentialSetResults.every((set) => !set.required || set.matching_options)
        : // If not credential_sets are used, we require that at least every credential has a match
          Object.keys(validMatches).length === ctx.dcqlQuery.credentials.length)

    return {
      ...dcqlQuery,
      canBeSatisfied: dqclQueryMatched,
      valid_matches: validMatches,
      invalid_matches: Object.keys(invalidMatches).length === 0 ? undefined : invalidMatches,
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
