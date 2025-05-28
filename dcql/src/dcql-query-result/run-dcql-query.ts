import type * as v from 'valibot'
import { runCredentialQuery } from '../dcql-parser/dcql-credential-query-result.js'
import type { DcqlQuery } from '../dcql-query/m-dcql-query.js'
import type { DcqlCredential } from '../u-dcql-credential.js'
import type { DcqlQueryResult } from './m-dcql-query-result.js'

export const runDcqlQuery = (
  dcqlQuery: DcqlQuery.Output,
  ctx: {
    credentials: DcqlCredential[]
    presentation: boolean
  }
): DcqlQueryResult => {
  const credentialQueriesResults = Object.fromEntries(
    dcqlQuery.credentials.map((credentialQuery) => [credentialQuery.id, runCredentialQuery(credentialQuery, ctx)])
  )

  const credentialMatches = Object.fromEntries(
    Object.entries(credentialQueriesResults).map(([key, credentialQueryResult]) => {
      // Find the best match for each credential query
      let bestMatch: v.InferOutput<typeof DcqlCredential.vParseSuccess> | undefined = undefined

      for (const credentialParseResult of credentialQueryResult) {
        const bestMatchForCredential = credentialParseResult.find((result) => result?.success === true)

        if (!bestMatch && bestMatchForCredential) {
          const { issues, ...matchWithoutIssues } = bestMatchForCredential
          bestMatch = matchWithoutIssues
          continue
        }

        // biome-ignore lint/style/noNonNullAssertion: <explanation>
        if (bestMatchForCredential && bestMatchForCredential.claim_set_index! < bestMatch?.claim_set_index!) {
          const { issues, ...matchWithoutIssues } = bestMatchForCredential
          bestMatch = matchWithoutIssues
        }
      }

      return [
        key,
        bestMatch ? { ...bestMatch, all: credentialQueryResult } : { success: false, all: credentialQueryResult },
      ]
    })
  ) satisfies DcqlQueryResult.CredentialMatchRecord

  const credentialSetResults = dcqlQuery.credential_sets?.map((set) => {
    const matchingOptions = set.options.filter((option) =>
      option.every((credentialQueryId) => credentialMatches[credentialQueryId]?.success)
    )

    return {
      ...set,
      matching_options: matchingOptions.length > 0 ? (matchingOptions as [string[], ...string[][]]) : undefined,
    }
  }) as DcqlQueryResult.Output['credential_sets']

  const dqclQueryMatched = credentialSetResults
    ? credentialSetResults.every((set) => !set.required || set.matching_options)
    : Object.values(credentialMatches).every((query) => query.success)

  return {
    ...dcqlQuery,
    can_be_satisfied: dqclQueryMatched,
    credential_matches: credentialMatches as DcqlQueryResult['credential_matches'],
    credential_sets: credentialSetResults,
  }
}
