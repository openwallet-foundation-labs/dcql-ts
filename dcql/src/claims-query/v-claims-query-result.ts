import * as v from 'valibot';
import { ClaimsQuery } from './v-claims-query.js';

export namespace ClaimsQueryResult {
  export const vParseResult = v.union([
    v.looseObject({
      success: v.literal(true),
      output: ClaimsQuery.vValue,
    }),
    v.looseObject({
      success: v.literal(false),
      output: v.unknown(),
    }),
  ]);
  export type ParseResult = v.InferOutput<typeof vParseResult>;

  export const vQueryResult = v.array(
    v.union([v.literal('all'), v.array(vParseResult)])
  );
  export type QueryResult = v.InferOutput<typeof vQueryResult>;

  export const vModelMdoc = v.object({
    ...ClaimsQuery.vMdoc.entries,
    claim_query_results: v.array(vQueryResult),
    isOptional: v.boolean(),
    isRequiredIfPresent: v.boolean(),
  });
  export type Mdoc = v.InferOutput<typeof vModelMdoc>;

  export const vW3cSdJwtVc = v.object({
    ...ClaimsQuery.vW3cSdJwtVc.entries,
    claim_query_results: v.array(vQueryResult),
    isOptional: v.boolean(),
    isRequiredIfPresent: v.boolean(),
  });
  export type W3cSdJwtVc = v.InferOutput<typeof vModelMdoc>;

  export const vModel = v.union([vModelMdoc, vW3cSdJwtVc]);
  export type Input = v.InferInput<typeof vModel>;
  export type Out = v.InferOutput<typeof vModel>;
}
export type ClaimsQueryResult = ClaimsQueryResult.Out;
