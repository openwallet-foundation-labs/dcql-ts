import * as v from 'valibot';
import type { Credential } from '../u-query.js';
import type { CredentialQuery } from './../dcql-query/m-credential-query.js';
import { getCredentialParser } from './claims-query-result.js';
import type { DcqlQueryResult } from './m-dcql-query-result.js';

export const queryCredentialFromCredentialQuery = (
  credentialQuery: CredentialQuery,
  credentials: Credential[]
) => {
  const credentialQueryResult: v.InferInput<
    typeof DcqlQueryResult.vCredentialQueryResult
  > = [];

  for (const [claimSetIndex, claim_set] of (
    credentialQuery.claim_sets ?? [undefined]
  ).entries()) {
    if (claimSetIndex === 0) credentialQueryResult[claimSetIndex] = [];

    const credentialParser = getCredentialParser(credentialQuery, claim_set);
    for (const [credentialIndex, credential] of credentials.entries()) {
      if (claimSetIndex > 0) {
        // if one the credential was successfully parsed against a previous claimsset we don't need to further validate other claim sets
        const previous =
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          credentialQueryResult[claimSetIndex - 1]![credentialIndex];

        // if the previous credential was successfully parsed we don't need to further validate the current credential
        // we set all further parsing attempts to undefined
        if (previous?.success || !previous) {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          credentialQueryResult[claimSetIndex]![credentialIndex] = undefined;
          continue;
        }
      }

      const parseResult = v.safeParse(credentialParser, credential);
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      credentialQueryResult[claimSetIndex]!.push({
        ...parseResult,
        ...(parseResult.issues && {
          flattened: v.flatten<typeof credentialParser>(parseResult.issues),
        }),
        credential_index: credentialIndex,
        claim_set_index: credentialQuery.claim_sets ? claimSetIndex : undefined,
      });
    }
  }

  return credentialQueryResult;
};
