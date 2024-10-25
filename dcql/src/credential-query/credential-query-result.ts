import * as v from 'valibot';
import {
  getClaimsQueriesForClaimSet,
  getNamespacesParser,
  queryClaimFromMdoc,
} from '../claims-query/claims-query-result.js';
import type { ClaimsQueryResult } from '../claims-query/v-claims-query-result.js';
import { InvalidCredentialQueryIdError } from '../e-vp-query.js';
import type { Mdoc } from '../u-query.js';
import { getIdMetadata } from '../u-query.js';
import type { CredentialQueryResult } from './v-credential-query-result.js';
import type { CredentialQuery } from './v-credential-query.js';

const queryClaimsFromCredentials = (
  credentialQuery: CredentialQuery,
  credentials: Mdoc[]
): ClaimsQueryResult.QueryResult[] => {
  const claimQueryResults: ClaimsQueryResult.QueryResult[] = [];

  if (!credentialQuery.claims) {
    claimQueryResults.push(['all']);
    return claimQueryResults;
  }

  if (credentialQuery.format !== 'mso_mdoc') {
    throw new Error('Hello World');
  }

  for (const claimQuery of credentialQuery.claims) {
    const claimQueryResultsForClaimSet: ClaimsQueryResult.QueryResult = [];
    for (const credential of credentials) {
      const res = queryClaimFromMdoc(claimQuery, credential);
      claimQueryResultsForClaimSet.push(res);
    }
    claimQueryResults.push(claimQueryResultsForClaimSet);
  }

  return claimQueryResults;
};

const getCredentialQueriesForCredentialSet = (
  credentialQueries: CredentialQuery[],
  credentialSet?: string[]
) => {
  if (!credentialSet) {
    return credentialQueries.map(query => ({ ...query, isOptional: false }));
  }
  return credentialSet.map(credential_id => {
    const { isOptional, baseId } = getIdMetadata(credential_id);

    const query = credentialQueries.find(
      credentialQuery => (credentialQuery.id = baseId)
    );
    if (!query) {
      throw new InvalidCredentialQueryIdError({
        message: `Credential-query with id '${baseId}' not found.`,
      });
    }
    return { ...query, isOptional };
  });
};

export const queryCredentialSet = (
  credentialQueries: CredentialQuery[],
  credentials: Mdoc[],
  credential_set?: [string, ...string[]]
) => {
  const credentialQueriesForCredentialSet =
    getCredentialQueriesForCredentialSet(credentialQueries, credential_set);

  const credentialQueryResults: CredentialQueryResult[] = [];

  for (const credentialQuery of credentialQueriesForCredentialSet) {
    if (credentialQuery.format !== 'mso_mdoc') {
      throw new Error('asdfasdf');
    }
    const vDocType = credentialQuery.meta?.doctype_values
      ? v.union(credentialQuery.meta.doctype_values.map(v.literal))
      : v.unknown();

    const claim_sets_results: CredentialQueryResult.QueryResult[] = [];

    for (const claim_set of credentialQuery.claim_sets ?? [undefined]) {
      const x2 = credentialQuery.claims
        ? getClaimsQueriesForClaimSet(credentialQuery.claims, claim_set)
        : undefined;
      const credentialParser = v.object({
        docType: vDocType,
        namespaces: x2
          ? getNamespacesParser(x2)
          : v.record(v.string(), v.record(v.string(), v.unknown())),
      });

      const credentialQueryResult: CredentialQueryResult.QueryResult = [];
      for (const credential of credentials) {
        const parseResult = v.safeParse(credentialParser, credential);

        const { typed, ...result } = parseResult;
        if (result.success) {
          credentialQueryResult.push({
            areRequiredClaimsPresent: result.success,
            ...result,
          });
        } else {
          credentialQueryResult.push({
            areRequiredClaimsPresent: result.success,
            ...result,
          });
        }
      }
      claim_sets_results.push(credentialQueryResult);
    }

    const claimQueryResults = queryClaimsFromCredentials(
      credentialQuery,
      credentials
    );

    credentialQueryResults.push({
      ...credentialQuery,
      claim_sets_results,
      claims: credentialQuery.claims?.map(claim => ({
        ...claim,
        claim_query_results: claimQueryResults,
      })),
    });
  }

  return credentialQueryResults;
};
