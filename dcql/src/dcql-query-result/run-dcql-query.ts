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

  const credentialSetResults = dcqlQuery.credential_sets?.map((set) => {
    const matchingOptions = set.options.filter((option) =>
      option.every((credentialQueryId) => credentialQueriesResults[credentialQueryId].success)
    )

    return {
      ...set,
      matching_options: matchingOptions.length > 0 ? (matchingOptions as [string[], ...string[][]]) : undefined,
    }
  }) as DcqlQueryResult.Output['credential_sets']

  const dqclQueryMatched = credentialSetResults
    ? credentialSetResults.every((set) => !set.required || set.matching_options)
    : // If not credential_sets are used, we require that at least every credential has a match
      dcqlQuery.credentials.every(({ id }) => credentialQueriesResults[id].success === true)

  return {
    ...dcqlQuery,
    can_be_satisfied: dqclQueryMatched,
    credential_matches: credentialQueriesResults,
    credential_sets: credentialSetResults,
  }
}
