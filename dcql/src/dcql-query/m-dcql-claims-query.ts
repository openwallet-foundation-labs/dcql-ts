import * as v from 'valibot';
import { idRegex } from '../u-dcql.js';

/**
 * Specifies claims withing a requested Credential.
 */
export namespace DcqlClaimsQuery {
  export const vValue = v.union([
    v.string(),
    v.pipe(v.number(), v.integer()),
    v.boolean(),
  ]);
  export type ClaimValue = v.InferOutput<typeof vValue>;

  export const vPath = v.union([
    v.string(),
    v.pipe(v.number(), v.integer(), v.minValue(0)),
    v.null(),
  ]);
  export type ClaimPath = v.InferOutput<typeof vPath>;

  export const vW3cSdJwtVc = v.object({
    id: v.pipe(
      v.optional(v.pipe(v.string(), v.regex(idRegex))),
      v.description(
        'A string identifying the particular claim. The value MUST be a non-empty string consisting of alphanumeric, underscore (_) or hyphen (-) characters. Within the particular claims array, the same id MUST NOT be present more than once.'
      )
    ),
    path: v.pipe(
      v.array(vPath),
      v.description(
        'A non-empty array representing a claims path pointer that specifies the path to a claim within the Verifiable Credential.'
      )
    ),
    values: v.pipe(
      v.optional(v.array(vValue)),
      v.description(
        'An array of strings, integers or boolean values that specifies the expected values of the claim. If the values property is present, the Wallet SHOULD return the claim only if the type and value of the claim both match for at least one of the elements in the array.'
      )
    ),
  });
  export type W3cAndSdJwtVc = v.InferOutput<typeof vW3cSdJwtVc>;

  export const vMdoc = v.object({
    id: v.pipe(
      v.optional(v.pipe(v.string(), v.regex(idRegex))),
      v.description(
        'A string identifying the particular claim. The value MUST be a non-empty string consisting of alphanumeric, underscore (_) or hyphen (-) characters. Within the particular claims array, the same id MUST NOT be present more than once.'
      )
    ),
    namespace: v.pipe(
      v.string(),
      v.description(
        'A string that specifies the namespace of the data element within the mdoc, e.g., org.iso.18013.5.1.'
      )
    ),
    claim_name: v.pipe(
      v.string(),
      v.description(
        'A string that specifies the data element identifier of the data element within the provided namespace in the mdoc, e.g., first_name.'
      )
    ),
    values: v.pipe(
      v.optional(v.array(vValue)),
      v.description(
        'An array of strings, integers or boolean values that specifies the expected values of the claim. If the values property is present, the Wallet SHOULD return the claim only if the type and value of the claim both match for at least one of the elements in the array.'
      )
    ),
  });
  export type Mdoc = v.InferOutput<typeof vMdoc>;

  export const vModel = v.union([vMdoc, vW3cSdJwtVc]);
  export type Input = v.InferInput<typeof vModel>;
  export type Out = v.InferOutput<typeof vModel>;
}
export type DcqlClaimsQuery = DcqlClaimsQuery.Out;
