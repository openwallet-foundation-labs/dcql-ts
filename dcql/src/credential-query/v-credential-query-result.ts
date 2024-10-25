import * as v from 'valibot';
import { ClaimsQueryResult } from '../claims-query/v-claims-query-result.js';
import { CredentialQuery } from './v-credential-query.js';

export namespace CredentialQueryResult {
  export const vParseResult = v.union([
    v.object({
      areRequiredClaimsPresent: v.literal(true),
      output: v.record(v.string(), v.unknown()),
    }),
    v.object({
      areRequiredClaimsPresent: v.literal(false),
      output: v.unknown(),
    }),
  ]);
  export type ParseResult = v.InferOutput<typeof vParseResult>;

  export const vQueryResult = v.array(vParseResult);
  export type QueryResult = v.InferOutput<typeof vQueryResult>;

  export const vMdoc = v.object({
    ...CredentialQuery.vMdoc.entries,
    claims: v.optional(
      v.pipe(
        v.array(
          v.omit(ClaimsQueryResult.vModelMdoc, [
            'isOptional',
            'isRequiredIfPresent',
          ])
        ),
        v.nonEmpty()
      )
    ),
    claim_sets_results: v.array(vQueryResult),
    isOptional: v.boolean(),
  });
  export type Mdoc = v.InferInput<typeof vMdoc>;

  const vW3cSdJwtVcBase = v.object({
    claims: v.optional(
      v.pipe(
        v.array(
          v.omit(ClaimsQueryResult.vW3cSdJwtVc, [
            'isOptional',
            'isRequiredIfPresent',
          ])
        ),
        v.nonEmpty()
      )
    ),
    claim_sets_results: v.array(vQueryResult),
    isOptional: v.boolean(),
  });

  export const vSdJwtVc = v.object({
    ...CredentialQuery.vSdJwtVc.entries,
    ...vW3cSdJwtVcBase.entries,
  });
  export type SdJwtVc = v.InferOutput<typeof vSdJwtVc>;

  export const vW3c = v.object({
    ...CredentialQuery.vW3c.entries,
    ...vW3cSdJwtVcBase.entries,
  });
  export type W3c = v.InferOutput<typeof vW3c>;

  export const vModel = v.variant('format', [vMdoc, vSdJwtVc, vW3c]);
  export type Input = v.InferInput<typeof vModel>;
  export type Out = v.InferOutput<typeof vModel>;
}
export type CredentialQueryResult = CredentialQueryResult.Out;
