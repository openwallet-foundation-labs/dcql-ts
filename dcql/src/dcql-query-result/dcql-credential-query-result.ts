/* eslint-disable @typescript-eslint/no-non-null-assertion */
import * as v from 'valibot';
import type { DcqlCredentialQuery } from '../dcql-query/m-dcql-credential-query.js';
import type { DcqlCredential } from '../u-dcql-credential.js';
import type {} from '../u-dcql.js';
import { getCredentialParser } from './dcql-claims-query-result.js';
import type { DcqlQueryResult } from './m-dcql-query-result.js';

export const queryCredentialFromCredentialQuery = (
  credentialQuery: DcqlCredentialQuery,
  ctx: {
    credentials: DcqlCredential[];
    presentation: boolean;
  }
): DcqlQueryResult.CredentialQueryResult => {
  const { credentials, presentation } = ctx;
  const claimSets = credentialQuery.claim_sets ?? [undefined];

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const credentialQueryResult: v.InferInput<
    typeof DcqlQueryResult.vCredentialQueryResult
  > = new Array(claimSets.length).fill([]);

  for (const [claimSetIndex, claim_set] of claimSets.entries()) {
    const credentialParser = getCredentialParser(credentialQuery, {
      claimSet: claim_set,
      presentation,
    });

    for (const [credentialIndex, credential] of credentials.entries()) {
      if (claimSetIndex > 0) {
        // if one the credential was successfully parsed against a previous claimsset we don't need to further validate other claim sets
        const previous =
          credentialQueryResult[claimSetIndex - 1]![credentialIndex];

        // if the previous credential was successfully parsed we don't need to further validate the current credential
        // we set all further parsing attempts to undefined
        if (previous?.success || !previous) {
          credentialQueryResult[claimSetIndex]![credentialIndex] = undefined;
          continue;
        }
      }

      const parseResult = v.safeParse(credentialParser, credential);
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

  return credentialQueryResult as DcqlQueryResult.CredentialQueryResult;
};
