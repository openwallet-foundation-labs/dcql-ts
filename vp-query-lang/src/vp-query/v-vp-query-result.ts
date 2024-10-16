import * as v from 'valibot';
import { CredentialQueryResult } from '../credential-query/v-credential-query-result.js';
import { VpQuery } from './v-vp-query.js';

export namespace VpQueryResult {
  export const vQueryResult = v.object({
    areRequiredCredentialsPresent: v.boolean(),
    credential_set_result: v.array(CredentialQueryResult.vModel),
  });
  export type QueryResult = v.InferOutput<typeof vQueryResult>;

  export const vModel = v.object({
    ...VpQuery.vModel.entries,
    credential_sets: VpQuery.vModel.entries.credential_sets,

    // The number of vp_query_results matches the number of credential_sets if provided or
    // is 1 in case credential sets is not present. The indexes match.
    credential_sets_results: v.array(vQueryResult),
  });
  export type Input = v.InferInput<typeof vModel>;
  export type Out = v.InferOutput<typeof vModel>;
}
export type VpQueryResult = VpQueryResult.Out;
