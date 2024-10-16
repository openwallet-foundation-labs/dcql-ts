import { queryCredentialSet } from '../credential-query/credential-query-result.js';
import type { Mdoc } from '../u-query.js';
import type { VpQueryResult } from './v-vp-query-result.js';
import type { VpQuery } from './v-vp-query.js';

export const queryVerifiablePresentation = (
  vpQuery: VpQuery,
  credentials: Mdoc[]
): VpQueryResult => {
  const credential_sets_results = (vpQuery.credential_sets ?? [undefined]).map(
    credential_set => {
      // TODO: SHOULD WE THROW IN CASE AN EMPTY CREDENTIAL_SET IS PASSED?
      if (credential_set?.length === 0) {
        return {
          areRequiredCredentialsPresent: true,
          credential_set_result: [],
        };
      }

      const credentialSetQueryResult = queryCredentialSet(
        vpQuery.credentials,
        credentials,
        credential_set as [string, ...string[]] | undefined
      );

      const areRequiredCredentialsPresent = credentialSetQueryResult.every(
        credentialQueryResult =>
          credentialQueryResult.isOptional ||
          credentialQueryResult.claim_sets_results.some(claimSetResult =>
            claimSetResult.some(
              claimQueryResult => claimQueryResult.areRequiredClaimsPresent
            )
          )
      );

      return {
        areRequiredCredentialsPresent,
        credential_set_result: credentialSetQueryResult,
      };
    }
  );

  return { ...vpQuery, credential_sets_results };
};
