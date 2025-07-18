import * as v from 'valibot'

import { DcqlInvalidPresentationRecordError, DcqlPresentationResultError } from '../dcql-error/e-dcql.js'
import { runCredentialQuery } from '../dcql-parser/dcql-credential-query-result.js'
import { DcqlQueryResult } from '../dcql-query-result/m-dcql-query-result.js'
import type { DcqlQuery } from '../dcql-query/m-dcql-query.js'
import type { DcqlCredentialPresentation } from './m-dcql-credential-presentation.js'

export namespace DcqlPresentationResult {
  export const vModel = v.omit(DcqlQueryResult.vModel, ['credentials'])

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
    dcqlPresentation: Record<string, DcqlCredentialPresentation | DcqlCredentialPresentation[]>,
    ctx: { dcqlQuery: DcqlQuery }
  ): Output => {
    const { dcqlQuery } = ctx

    const queriesResults = Object.entries(dcqlPresentation).map(([credentialQueryId, presentations]) => {
      const credentialQuery = dcqlQuery.credentials.find((c) => c.id === credentialQueryId)
      if (!credentialQuery) {
        throw new DcqlPresentationResultError({
          message: `Query ${credentialQueryId} not found in the dcql query. Cannot validate presentation.`,
        })
      }

      if (Array.isArray(presentations)) {
        if (presentations.length === 0) {
          throw new DcqlPresentationResultError({
            message: `Query credential '${credentialQueryId}' is present in the presentations but the value is an empty array. Each entry must at least provide one presentation.`,
          })
        }

        if (!credentialQuery.multiple && presentations.length > 1) {
          throw new DcqlPresentationResultError({
            message: `Query credential '${credentialQueryId}' has not enabled 'multiple', but multiple presentations were provided. Only a single presentation is allowed for each query credential when 'multiple' is not enabled on the query.`,
          })
        }
      }

      return runCredentialQuery(credentialQuery, {
        presentation: true,
        credentials: presentations ? (Array.isArray(presentations) ? presentations : [presentations]) : [],
      })
    })

    const credentialSetResults = dcqlQuery.credential_sets?.map((set) => {
      const matchingOptions = set.options.filter((option) =>
        option.every(
          (credentialQueryId) =>
            queriesResults.find((result) => result.credential_query_id === credentialQueryId)?.success
        )
      )

      return {
        ...set,
        matching_options: matchingOptions.length > 0 ? (matchingOptions as [string[], ...string[][]]) : undefined,
      }
    }) as DcqlQueryResult.Output['credential_sets']

    const dqclQueryMatched =
      // We require that all the submitted presentations match with the queries
      // So we must have success for all queries, and we don't allow failed_credentials
      queriesResults.every((result) => result.success && !result.failed_credentials) &&
      (credentialSetResults
        ? credentialSetResults.every((set) => !set.required || set.matching_options)
        : // If not credential_sets are used, we require that at least every credential has a match
          dcqlQuery.credentials.every(
            (credentialQuery) =>
              queriesResults.find((result) => result.credential_query_id === credentialQuery.id)?.success
          ))

    return {
      // NOTE: can_be_satisfied is maybe not the best term, because we return false if it can be
      // satisfied, but one of the provided presentations did not match
      can_be_satisfied: dqclQueryMatched,
      credential_sets: credentialSetResults,
      credential_matches: Object.fromEntries(queriesResults.map((result) => [result.credential_query_id, result])),
    }
  }

  export const validate = (dcqlQueryResult: DcqlPresentationResult) => {
    if (!dcqlQueryResult.can_be_satisfied) {
      throw new DcqlInvalidPresentationRecordError({
        message: 'Invalid Presentation record',
        cause: dcqlQueryResult,
      })
    }

    return dcqlQueryResult satisfies Output
  }
}
export type DcqlPresentationResult = DcqlPresentationResult.Output
