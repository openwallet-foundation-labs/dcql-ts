import { queryCredentialFromCredentialQuery as perfromCredentialQuery } from '../credential-query/credential-query-result.js';
import type { Mdoc } from '../u-query.js';
import type { DcqlQueryResult } from './m-dcql-query-result.js';
import type { DcqlQuery } from './m-dcql-query.js';

export const performDcqlQuery = (
  dcqlQuery: DcqlQuery,
  credentials: Mdoc[]
): DcqlQueryResult => {
  const credentialQueriesResults = Object.fromEntries(
    dcqlQuery.credentials.map(credentialQuery => [
      credentialQuery.id,
      perfromCredentialQuery(credentialQuery, credentials),
    ])
  );

  const bestMatchForQuery = Object.fromEntries(
    Object.entries(credentialQueriesResults).map(
      ([key, credentialQueryResult]) => {
        return [
          key,
          credentialQueryResult
            .flatMap(queryResult => queryResult)
            .find(r => r?.success == true),
        ];
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
    credential_sets: credentialSetResults,
  };
};
