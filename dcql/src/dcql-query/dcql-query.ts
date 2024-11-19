import { queryCredentialFromCredentialQuery as perfromCredentialQuery } from '../dcql-query-result/credential-query-result.js';
import type { DcqlQueryResult } from '../dcql-query-result/m-dcql-query-result.js';
import type { Credential } from '../u-query.js';
import type { DcqlQuery } from './m-dcql-query.js';

export const performDcqlQuery = (
  dcqlQuery: DcqlQuery.Output,
  credentials: Credential[]
): DcqlQueryResult => {
  const credentialQueriesResults = Object.fromEntries(
    dcqlQuery.credentials.map(credentialQuery => [
      credentialQuery.id,
      perfromCredentialQuery(
        credentialQuery,
        credentials
      ) as DcqlQueryResult.CredentialQueryResult,
    ])
  );

  const bestMatchForQuery = Object.fromEntries(
    Object.entries(credentialQueriesResults).map(
      ([key, credentialQueryResult]) => {
        // Find the best match for each credential query
        let bestMatch: DcqlQueryResult.CredentialParseSuccess | undefined =
          undefined;

        for (const credentialParseResult of credentialQueryResult) {
          const bestMatchForCredential = credentialParseResult.find(
            result => result?.success == true
          );

          if (!bestMatch) {
            bestMatch = bestMatchForCredential;
            continue;
          }

          if (
            bestMatchForCredential &&
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            bestMatchForCredential.claim_set_index! < bestMatch.claim_set_index!
          ) {
            bestMatch = bestMatchForCredential;
          }
        }

        return [key, bestMatch ? { ...bestMatch } : undefined];
      }
    )
  );

  const credentialSetResults = dcqlQuery.credential_sets?.map(set => {
    const matchingOptions = set.options.filter(option =>
      option.every(
        credentialQueryId => bestMatchForQuery[credentialQueryId]?.success
      )
    );

    return {
      ...set,
      matching_options:
        matchingOptions.length > 0
          ? (matchingOptions as [string[], ...string[][]])
          : undefined,
    };
  }) as DcqlQueryResult.Output['credential_sets'];

  const dqclQueryMatched = credentialSetResults
    ? credentialSetResults.every(set => !set.required || set.matching_options)
    : Object.values(bestMatchForQuery).every(query => query?.success);

  return {
    ...dcqlQuery,
    areRequiredCredentialsPresent: dqclQueryMatched,
    query_matches: bestMatchForQuery,
    credential_query_results: credentialQueriesResults,
    credential_sets: credentialSetResults,
  };
};
