import * as v from 'valibot';
import { CredentialSetQuery } from '../credential-set-query/m-credential-set-query.js';
import { vNonEmptyArray } from '../u-query.js';
import { DcqlQuery } from './m-dcql-query.js';

export const vParseSuccess = v.object({
  success: v.literal(true),
  typed: v.literal(true),
  output: v.object({
    docType: v.string(),
    namespaces: v.record(v.string(), v.record(v.string(), v.unknown())),
  }), // just for mdoc
  issues: v.optional(v.undefined()),
});

export const vParseFailure = v.object({
  success: v.literal(false),
  typed: v.boolean(),
  output: v.unknown(),
  issues: v.array(v.unknown()),
});

export const vTest = v.pipe(
  v.array(v.array(v.union([v.undefined(), vParseSuccess, vParseFailure]))),
  vNonEmptyArray()
);

export namespace DcqlQueryResult {
  export const vQueryResult = v.object({
    areRequiredCredentialsPresent: v.boolean(),
  });
  export type QueryResult = v.InferOutput<typeof vQueryResult>;

  export const vModel = v.object({
    ...DcqlQuery.vModel.entries,
    query_matches: v.record(
      v.string(),
      v.union([v.undefined(), vParseSuccess])
    ),
    credential_sets: v.optional(
      v.pipe(
        v.array(
          v.object({
            ...CredentialSetQuery.vModel.entries,
            matching_options: v.union([
              v.undefined(),
              v.pipe(v.array(v.array(v.string())), vNonEmptyArray()),
            ]),
          })
        ),
        vNonEmptyArray(),
        v.description(
          `OPTIONAL. A non-empty array of credential set queries that specifies additional constraints on which of the requested Verifiable Credentials to return.`
        )
      )
    ),
    areRequiredCredentialsPresent: v.boolean(),
  });
  export type Input = v.InferInput<typeof vModel>;
  export type Output = v.InferOutput<typeof vModel>;
}
export type DcqlQueryResult = DcqlQueryResult.Output;
