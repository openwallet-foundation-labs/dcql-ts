import * as v from 'valibot'
import { DcqlUndefinedClaimSetIdError } from '../dcql-error/e-dcql.js'
import { idRegex, vIdString, vNonEmptyArray } from '../u-dcql.js'
import { DcqlClaimsQuery } from './m-dcql-claims-query.js'
import { DcqlTrustedAuthoritiesQuery } from './m-dcql-trusted-authorities.js'

/**
 * A Credential Query is an object representing a request for a presentation of one Credential.
 */
export namespace DcqlCredentialQuery {
  const vBase = v.object({
    id: v.pipe(
      v.string(),
      v.regex(idRegex),
      v.description(
        `REQUIRED. A string identifying the Credential in the response and, if provided, the constraints in 'credential_sets'.`
      )
    ),
    require_cryptographic_holder_binding: v.pipe(
      v.optional(v.boolean(), true),
      v.description(
        'OPTIONAL. A boolean which indicates whether the Verifier requires a Cryptographic Holder Binding proof. The default value is true, i.e., a Verifiable Presentation with Cryptographic Holder Binding is required. If set to false, the Verifier accepts a Credential without Cryptographic Holder Binding proof.'
      )
    ),
    multiple: v.pipe(
      v.optional(v.boolean(), false),
      v.description(
        'OPTIONAL. A boolean which indicates whether multiple Credentials can be returned for this Credential Query. If omitted, the default value is false.'
      )
    ),
    claim_sets: v.pipe(
      v.optional(vNonEmptyArray(vNonEmptyArray(vIdString))),
      v.description(
        `OPTIONAL. A non-empty array containing arrays of identifiers for elements in 'claims' that specifies which combinations of 'claims' for the Credential are requested.`
      )
    ),
    trusted_authorities: v.pipe(
      v.optional(vNonEmptyArray(DcqlTrustedAuthoritiesQuery.vModel)),
      v.description(
        'OPTIONAL. A non-empty array of objects as defined in Section 6.1.1 that specifies expected authorities or trust frameworks that certify Issuers, that the Verifier will accept. Every Credential returned by the Wallet SHOULD match at least one of the conditions present in the corresponding trusted_authorities array if present.'
      )
    ),
  })

  export const vMdoc = v.object({
    ...vBase.entries,
    format: v.pipe(
      v.literal('mso_mdoc'),
      v.description('REQUIRED. A string that specifies the format of the requested Verifiable Credential.')
    ),
    claims: v.pipe(
      v.optional(vNonEmptyArray(DcqlClaimsQuery.vMdoc)),
      v.description('OPTIONAL. A non-empty array of objects as that specifies claims in the requested Credential.')
    ),
    meta: v.pipe(
      v.optional(
        v.object({
          doctype_value: v.pipe(
            v.optional(v.string()),
            v.description(
              'OPTIONAL. String that specifies an allowed value for the doctype of the requested Verifiable Credential.'
            )
          ),
        })
      ),
      v.description(
        'OPTIONAL. An object defining additional properties requested by the Verifier that apply to the metadata and validity data of the Credential.'
      )
    ),
  })
  export type Mdoc = v.InferOutput<typeof vMdoc>

  export const vSdJwtVc = v.object({
    ...vBase.entries,
    format: v.pipe(
      v.picklist(['vc+sd-jwt', 'dc+sd-jwt']),
      v.description('REQUIRED. A string that specifies the format of the requested Verifiable Credential.')
    ),
    claims: v.pipe(
      v.optional(vNonEmptyArray(DcqlClaimsQuery.vW3cSdJwtVc)),
      v.description('OPTIONAL. A non-empty array of objects as that specifies claims in the requested Credential.')
    ),
    meta: v.pipe(
      v.optional(
        v.pipe(
          v.object({
            vct_values: v.optional(v.array(v.string())),
          }),
          v.description(
            'OPTIONAL. An array of strings that specifies allowed values for the type of the requested Verifiable Credential.'
          )
        )
      ),
      v.description(
        'OPTIONAL. An object defining additional properties requested by the Verifier that apply to the metadata and validity data of the Credential.'
      )
    ),
  })
  export type SdJwtVc = v.InferOutput<typeof vSdJwtVc>

  export const vW3cVc = v.object({
    ...vBase.entries,
    format: v.pipe(
      v.picklist(['jwt_vc_json', 'ldp_vc', 'vc+sd-jwt']),
      v.description('REQUIRED. A string that specifies the format of the requested Verifiable Credential.')
    ),
    claims: v.pipe(
      v.optional(vNonEmptyArray(DcqlClaimsQuery.vW3cSdJwtVc)),
      v.description('OPTIONAL. A non-empty array of objects as that specifies claims in the requested Credential.')
    ),
    meta: v.pipe(
      v.pipe(
        v.object({
          type_values: v.pipe(
            vNonEmptyArray(vNonEmptyArray(v.string())),
            v.description(
              'REQUIRED. An array of string arrays that specifies the fully expanded types (IRIs) after the @context was applied that the Verifier accepts to be presented in the Presentation. Each of the top-level arrays specifies one alternative to match the type values of the Verifiable Credential against. Each inner array specifies a set of fully expanded types that MUST be present in the type property of the Verifiable Credential, regardless of order or the presence of additional types.'
            )
          ),
        })
      ),
      v.description(
        'REQUIRED. An object defining additional properties requested by the Verifier that apply to the metadata and validity data of the Credential.'
      )
    ),
  })
  export type W3cVc = v.InferOutput<typeof vW3cVc>

  export const vModel = v.variant('format', [vMdoc, vW3cVc, vSdJwtVc])
  export type Input = v.InferInput<typeof vModel>
  export type Output = v.InferOutput<typeof vModel>

  export const validate = (credentialQuery: Output) => {
    claimSetIdsAreDefined(credentialQuery)
  }
}
export type DcqlCredentialQuery = DcqlCredentialQuery.Output

// --- validations --- //

const claimSetIdsAreDefined = (credentialQuery: DcqlCredentialQuery) => {
  if (!credentialQuery.claim_sets) return
  const claimIds = new Set(credentialQuery.claims?.map((claim) => claim.id))

  const undefinedClaims: string[] = []
  for (const claim_set of credentialQuery.claim_sets) {
    for (const claim_id of claim_set) {
      if (!claimIds.has(claim_id)) {
        undefinedClaims.push(claim_id)
      }
    }
  }

  if (undefinedClaims.length > 0) {
    throw new DcqlUndefinedClaimSetIdError({
      message: `Credential set contains undefined credential id${undefinedClaims.length === 0 ? '' : '`s'} '${undefinedClaims.join(', ')}'`,
    })
  }
}
