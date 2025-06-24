import * as v from 'valibot'
import { vIdString, vNonEmptyArray } from '../u-dcql.js'

/**
 * Specifies claims withing a requested Credential.
 */
export namespace DcqlClaimsQuery {
  export const vValue = v.union([v.string(), v.pipe(v.number(), v.integer()), v.boolean()])

  export const vPath = v.union([v.string(), v.pipe(v.number(), v.integer(), v.minValue(0)), v.null()])

  export const vW3cSdJwtVc = v.object({
    id: v.pipe(
      v.optional(vIdString),
      v.description(
        'A string identifying the particular claim. The value MUST be a non-empty string consisting of alphanumeric, underscore (_) or hyphen (-) characters. Within the particular claims array, the same id MUST NOT be present more than once.'
      )
    ),
    path: v.pipe(
      vNonEmptyArray(vPath),
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
  })
  export type W3cAndSdJwtVc = v.InferOutput<typeof vW3cSdJwtVc>

  const vMdocBase = v.object({
    id: v.pipe(
      v.optional(vIdString),
      v.description(
        'A string identifying the particular claim. The value MUST be a non-empty string consisting of alphanumeric, underscore (_) or hyphen (-) characters. Within the particular claims array, the same id MUST NOT be present more than once.'
      )
    ),
    values: v.pipe(
      v.optional(v.array(vValue)),
      v.description(
        'An array of strings, integers or boolean values that specifies the expected values of the claim. If the values property is present, the Wallet SHOULD return the claim only if the type and value of the claim both match for at least one of the elements in the array.'
      )
    ),
  })

  // Syntax up until Draft 23 of OID4VP. Keeping due to Draft 23 having
  // reach ID-3 status and thus being targeted by several implementations
  export const vMdocNamespace = v.object({
    ...vMdocBase.entries,

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
  })

  // Syntax starting from Draft 24 of OID4VP
  export const vMdocPath = v.object({
    ...vMdocBase.entries,

    intent_to_retain: v.pipe(
      v.optional(v.boolean()),
      v.description(
        'A boolean that is equivalent to `IntentToRetain` variable defined in Section 8.3.2.1.2.1 of [@ISO.18013-5].'
      )
    ),

    path: v.pipe(
      v.tuple([
        v.pipe(
          v.string(),
          v.description(
            'A string that specifies the namespace of the data element within the mdoc, e.g., org.iso.18013.5.1.'
          )
        ),
        v.pipe(
          v.string(),
          v.description(
            'A string that specifies the data element identifier of the data element within the provided namespace in the mdoc, e.g., first_name.'
          )
        ),
      ]),
      v.description(
        'An array defining a claims path pointer into an mdoc. It must contain two elements of type string. The first element refers to a namespace and the second element refers to a data element identifier.'
      )
    ),
  })
  export const vMdoc = v.union([vMdocNamespace, vMdocPath])
  export type MdocNamespace = v.InferOutput<typeof vMdocNamespace>
  export type MdocPath = v.InferOutput<typeof vMdocPath>
  export type Mdoc = v.InferOutput<typeof vMdoc>

  export const vModel = v.union([vMdoc, vW3cSdJwtVc])
  export type Input = v.InferInput<typeof vModel>
  export type Out = v.InferOutput<typeof vModel>

  export type ClaimValue = v.InferOutput<typeof vValue>
}
export type DcqlClaimsQuery = DcqlClaimsQuery.Out
