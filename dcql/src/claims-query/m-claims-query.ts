import * as v from 'valibot';
import { idRegex } from '../u-query.js';

/**
 * Specifies claims withing a requested Credential.
 */
export namespace ClaimsQuery {
  export const vValue = v.union([
    v.string(),
    v.pipe(v.number(), v.integer()),
    v.boolean(),
  ]);
  export type ClaimValue = v.InferOutput<typeof vValue>;

  export const vPath = v.union([
    v.string(),
    v.pipe(v.number(), v.integer(), v.minValue(0)),
    v.literal('*'),
  ]);
  export type ClaimPath = v.InferOutput<typeof vPath>;

  export const vW3cSdJwtVc = v.object({
    id: v.optional(v.pipe(v.string(), v.regex(idRegex))),
    path: v.optional(v.array(vPath)),
    values: v.optional(v.array(vValue)),
  });
  export type W3cAndSdJwtVcInput = v.InferOutput<typeof vW3cSdJwtVc>;

  export const vMdoc = v.object({
    id: v.optional(v.pipe(v.string(), v.regex(idRegex))),
    namespace: v.string(),
    claim_name: v.string(),
    values: v.optional(v.array(vValue)),
  });
  export type Mdoc = v.InferOutput<typeof vMdoc>;

  export const vModel = v.union([vMdoc, vW3cSdJwtVc]);
  export type Input = v.InferInput<typeof vModel>;
  export type Out = v.InferOutput<typeof vModel>;
}
export type ClaimsQuery = ClaimsQuery.Out;
