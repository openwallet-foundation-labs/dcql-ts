import { queryCredentialFromCredentialQuery } from '../dcql-query-result/dcql-credential-query-result.js';
import type { DcqlQueryResult } from '../dcql-query-result/m-dcql-query-result.js';
import type { DcqlCredential } from '../u-dcql-credential.js';
import type { DcqlQuery } from './m-dcql-query.js';

export const performDcqlQuery = (
  dcqlQuery: DcqlQuery.Output,
  ctx: {
    credentials: DcqlCredential[];
    presentation: boolean;
  }
): DcqlQueryResult => {
  const credentialQueriesResults = Object.fromEntries(
    dcqlQuery.credentials.map(credentialQuery => [
      credentialQuery.id,
      queryCredentialFromCredentialQuery(credentialQuery, ctx),
    ])
  );

  const credentialMatches = Object.fromEntries(
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

        return [
          key,
          bestMatch
            ? { ...bestMatch, all: credentialQueryResult }
            : // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
              { ...credentialQueryResult[0][0]!, all: credentialQueryResult },
        ];
      }
    )
  ) satisfies DcqlQueryResult.CredentialMatchRecord;

  const credentialSetResults = dcqlQuery.credential_sets?.map(set => {
    const matchingOptions = set.options.filter(option =>
      option.every(
        credentialQueryId => credentialMatches[credentialQueryId]?.success
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
    : Object.values(credentialMatches).every(query => query.success);

  return {
    ...dcqlQuery,
    canBeSatisfied: dqclQueryMatched,
    credential_matches:
      credentialMatches as DcqlQueryResult['credential_matches'],
    credential_sets: credentialSetResults,
  };
};
