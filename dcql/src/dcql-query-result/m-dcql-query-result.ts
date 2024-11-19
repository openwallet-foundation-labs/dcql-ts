import * as v from 'valibot';
import { ClaimsQuery } from '../dcql-query/m-claims-query.js';
import { CredentialQuery } from '../dcql-query/m-credential-query.js';
import { CredentialSetQuery } from '../dcql-query/m-credential-set-query.js';
import { vNonEmptyArray } from '../u-query.js';

const vCredentialParseSuccess = v.object({
  success: v.literal(true),
  typed: v.literal(true),
  output: v.union([
    v.object({
      docType: v.string(),
      namespaces: v.record(v.string(), v.record(v.string(), v.unknown())),
    }),
    v.object({
      vct: v.string(),
      claims: ClaimsQuery.vJsonRecord,
    }),
    v.object({
      claims: ClaimsQuery.vJsonRecord,
    }),
  ]), // just for mdoc
  issues: v.optional(v.undefined()),
  credential_index: v.number(),
  claim_set_index: v.union([v.number(), v.undefined()]),
});

const vCredentialParseFailure = v.object({
  success: v.literal(false),
  typed: v.boolean(),
  output: v.unknown(),
  issues: v.array(v.unknown()),
  credential_index: v.number(),
  claim_set_index: v.union([v.number(), v.undefined()]),
});

export namespace DcqlQueryResult {
  export type CredentialParseSuccess = v.InferOutput<
    typeof vCredentialParseSuccess
  >;

  export const vCredentialQueryResult = v.pipe(
    v.array(
      v.array(
        v.union([
          v.undefined(),
          vCredentialParseSuccess,
          vCredentialParseFailure,
        ])
      )
    ),
    vNonEmptyArray()
  );

  export type CredentialQueryResult = v.InferOutput<
    typeof vCredentialQueryResult
  >;

  export const vModel = v.object({
    credentials: v.pipe(
      v.array(CredentialQuery.vModel),
      vNonEmptyArray(),
      v.description(
        `REQUIRED. A non-empty array of Credential Queries that specify the requested Verifiable Credentials.`
      )
    ),
    query_matches: v.record(
      v.string(),
      v.union([
        v.undefined(),
        v.object({
          ...vCredentialParseSuccess.entries,
          credential_index: v.number(),
        }),
      ])
    ),

    credential_query_results: v.record(v.string(), vCredentialQueryResult),

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
