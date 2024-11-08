import * as v from 'valibot';
import {
  getClaimsQueriesForClaimSet,
  getNamespacesParser,
} from '../claims-query/claims-query-result.js';
import type { vTest } from '../dcql-query/m-dcql-query-result.js';
import type { Mdoc } from '../u-query.js';
import type { CredentialQuery } from './m-credential-query.js';

export const queryCredentialFromCredentialQuery = (
  credentialQuery: CredentialQuery,
  credentials: Mdoc[]
) => {
  if (credentialQuery.format !== 'mso_mdoc') {
    throw new Error('asdfasdf');
  }

  const credentialQueryResults: v.InferInput<typeof vTest> = [];

  const vDocType = credentialQuery.meta?.doctype_value
    ? v.literal(credentialQuery.meta.doctype_value)
    : v.string();

  for (const [claimSetIndex, claim_set] of (
    credentialQuery.claim_sets ?? [undefined]
  ).entries()) {
    const claimSetQueries =
      credentialQuery.claims && claim_set
        ? getClaimsQueriesForClaimSet(credentialQuery.claims, claim_set)
        : credentialQuery.claims;

    const credentialParser = v.object({
      docType: vDocType,
      namespaces: claimSetQueries
        ? getNamespacesParser(claimSetQueries)
        : v.record(v.string(), v.record(v.string(), v.unknown())),
    });

    for (const [credentialIndex, credential] of credentials.entries()) {
      if (claimSetIndex === 0) credentialQueryResults[claimSetIndex] = [];

      if (
        (claimSetIndex > 0 &&
          credentialQueryResults[claimSetIndex - 1]![credentialIndex]
            ?.success) ||
        undefined
      ) {
        credentialQueryResults[claimSetIndex]![credentialIndex] = undefined;
        continue;
      }

      const parseResult = v.safeParse(credentialParser, credential);
      credentialQueryResults[claimSetIndex]![credentialIndex] = {
        ...parseResult,
        ...(parseResult.issues && {
          credential_query_id: credentialQuery.id,
          claim_set,
          flattened: v.flatten<typeof credentialParser>(parseResult.issues),
        }),
      };
    }
  }

  return credentialQueryResults;
};
