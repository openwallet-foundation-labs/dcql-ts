import * as v from 'valibot';
import { DcqlCredentialQuery } from '../dcql-query/m-dcql-credential-query.js';
import { CredentialSetQuery } from '../dcql-query/m-dcql-credential-set-query.js';
import { DcqlMdocRepresentation } from '../u-dcql-credential-representation.js';
import {
  idRegex,
  vJsonRecord,
  vNonEmptyArray,
  vParseFailure,
  vParseSuccess,
} from '../u-dcql.js';

export namespace DcqlQueryResult {
  export const vW3cCredentialParseOutput = v.object({ claims: vJsonRecord });
  export type W3cCredentialParseOutput = v.InferOutput<
    typeof vW3cCredentialParseOutput
  >;

  export const vSdJwtCredentialParseOutput = v.object({
    vct: v.string(),
    claims: vJsonRecord,
  });
  export type SdJwtCredentialParseOutput = v.InferOutput<
    typeof vSdJwtCredentialParseOutput
  >;

  export const vMdocCredentialParseOutput = v.object({
    docType: v.string(),
    namespaces: DcqlMdocRepresentation.vNamespaces,
  });
  export type MdocCredentialParseOutput = v.InferOutput<
    typeof vMdocCredentialParseOutput
  >;

  const vCredentialParseSuccess = v.object({
    ...vParseSuccess.entries,
    output: v.union([
      vW3cCredentialParseOutput,
      vSdJwtCredentialParseOutput,
      vMdocCredentialParseOutput,
    ]),
  });

  export type CredentialParseSuccess = v.InferOutput<
    typeof vCredentialParseSuccess
  >;

  export const vCredentialParseResult = v.union([
    vCredentialParseSuccess,
    vParseFailure,
  ]);

  export type CredentialParseResult = v.InferOutput<
    typeof vCredentialParseResult
  >;

  export const vCredentialQueryResult = v.pipe(
    v.array(
      v.array(v.union([v.undefined(), ...vCredentialParseResult.options]))
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
              v.array(
                v.union([v.undefined(), vCredentialParseSuccess, vParseFailure])
              )
            ),
            vNonEmptyArray()
          ),
        }),
        v.object({
          ...vParseFailure.entries,
          all: v.pipe(
            v.array(
              v.array(
                v.union([v.undefined(), vCredentialParseSuccess, vParseFailure])
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

  export type CredentialMatch = Output['credential_matches'][number];
  export type CredentialMatchRecord = Output['credential_matches'];
}
export type DcqlQueryResult = DcqlQueryResult.Output;
