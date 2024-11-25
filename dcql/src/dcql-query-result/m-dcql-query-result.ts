import * as v from 'valibot';
import { DcqlCredentialQuery } from '../dcql-query/m-dcql-credential-query.js';
import { CredentialSetQuery } from '../dcql-query/m-dcql-credential-set-query.js';
import {
  idRegex,
  vCredentialParseFailure,
  vCredentialParseSuccess,
  vNonEmptyArray,
} from '../u-dcql.js';

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
      v.array(DcqlCredentialQuery.vModel),
      vNonEmptyArray(),
      v.description(
        `REQUIRED. A non-empty array of Credential Queries that specify the requested Verifiable Credentials.`
      )
    ),

    credential_matches: v.record(
      v.pipe(v.string(), v.regex(idRegex)),
      v.union([
        v.object({
          ...vCredentialParseSuccess.entries,
          all: v.pipe(
            v.array(
              v.pipe(
                v.array(
                  v.union([
                    v.undefined(),
                    vCredentialParseSuccess,
                    vCredentialParseFailure,
                  ])
                ),
                vNonEmptyArray()
              )
            ),
            vNonEmptyArray()
          ),
        }),
        v.object({
          success: vCredentialParseFailure.entries.success,
          all: v.pipe(
            v.array(
              v.pipe(
                v.array(
                  v.union([
                    v.undefined(),
                    vCredentialParseSuccess,
                    vCredentialParseFailure,
                  ])
                ),
                vNonEmptyArray()
              )
            ),
            vNonEmptyArray()
          ),
        }),
      ])
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

    canBeSatisfied: v.boolean(),
  });
  export type Input = v.InferInput<typeof vModel>;
  export type Output = v.InferOutput<typeof vModel>;

  export type CredentialMatch = Input['credential_matches'][number];
  export type CredentialMatchRecord = Input['credential_matches'];
}
export type DcqlQueryResult = DcqlQueryResult.Output;
