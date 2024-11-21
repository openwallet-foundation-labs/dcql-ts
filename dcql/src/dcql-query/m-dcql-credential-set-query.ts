import * as v from 'valibot';
import { vIdString, vNonEmptyArray } from '../u-dcql.js';

/**
 * A Credential Set Query is an object representing
 * a request for one or more credentials to satisfy a particular use case with the Verifier.
 */
export namespace CredentialSetQuery {
  export const vModel = v.object({
    options: v.pipe(
      v.array(v.array(vIdString)),
      vNonEmptyArray(),
      v.description(
        `REQUIRED. A non-empty array, where each value in the array is a list of Credential Query identifiers representing one set of Credentials that satisfies the use case.`
      )
    ),
    required: v.pipe(
      v.optional(v.boolean(), true),
      v.description(
        `OPTIONAL. Boolean which indicates whether this set of Credentials is required to satisfy the particular use case at the Verifier. If omitted, the default value is 'true'.`
      )
    ),
    purpose: v.pipe(
      v.optional(
        v.union([v.string(), v.number(), v.record(v.string(), v.unknown())])
      ),
      v.description(
        `OPTIONAL. A string, number or object specifying the purpose of the query.`
      )
    ),
  });

  export type Input = v.InferInput<typeof vModel>;
  export type Output = v.InferOutput<typeof vModel>;
}
export type CredentialSetQuery = CredentialSetQuery.Output;
