import * as v from 'valibot'
import { vBase64url, vNonEmptyArray } from '../u-dcql.js'

export const getTrustedAuthorityParser = (trustedAuthority: DcqlTrustedAuthoritiesQuery) =>
  v.object(
    {
      type: v.literal(
        trustedAuthority.type,
        (i) =>
          `Expected trusted authority type to be '${trustedAuthority.type}' but received ${typeof i.input === 'string' ? `'${i.input}'` : i.input}`
      ),
      value: v.union(
        trustedAuthority.values.map((value) =>
          v.literal(
            value,
            (i) =>
              `Expected trusted authority value to be '${value}' but received ${typeof i.input === 'string' ? `'${i.input}'` : i.input}`
          )
        ),
        (i) =>
          `Expected trusted authority value to be '${trustedAuthority.values.join("' | '")}' but received ${typeof i.input === 'string' ? `'${i.input}'` : i.input}`
      ),
    },
    `Expected trusted authority object with type '${trustedAuthority.type}' to be defined, but received undefined`
  )

const vAuthorityKeyIdentifier = v.object({
  type: v.literal('aki'),
  value: v.pipe(
    v.string(),
    vBase64url,
    v.description(
      'Contains the KeyIdentifier of the AuthorityKeyIdentifier as defined in Section 4.2.1.1 of [RFC5280], encoded as base64url. The raw byte representation of this element MUST match with the AuthorityKeyIdentifier element of an X.509 certificate in the certificate chain present in the credential (e.g., in the header of an mdoc or SD-JWT). Note that the chain can consist of a single certificate and the credential can include the entire X.509 chain or parts of it.'
    )
  ),
})

const vEtsiTrustedList = v.object({
  type: v.literal('etsi_tl'),
  value: v.pipe(
    v.string(),
    v.url(),
    v.check(
      (url) => url.startsWith('http://') || url.startsWith('https://'),
      'etsi_tl trusted authority value must be a valid https url'
    ),
    v.description(
      'The identifier of a Trusted List as specified in ETSI TS 119 612 [ETSI.TL]. An ETSI Trusted List contains references to other Trusted Lists, creating a list of trusted lists, or entries for Trust Service Providers with corresponding service description and X.509 Certificates. The trust chain of a matching Credential MUST contain at least one X.509 Certificate that matches one of the entries of the Trusted List or its cascading Trusted Lists.'
    )
  ),
})

const vOpenidFederation = v.object({
  type: v.literal('openid_federation'),
  value: v.pipe(
    v.string(),
    v.url(),
    // TODO: should we have a config similar to oid4vc-ts to support http for development?
    v.check(
      (url) => url.startsWith('http://') || url.startsWith('https://'),
      'openid_federation trusted authority value must be a valid https url'
    ),
    v.description(
      'The Entity Identifier as defined in Section 1 of [OpenID.Federation] that is bound to an entity in a federation. While this Entity Identifier could be any entity in that ecosystem, this entity would usually have the Entity Configuration of a Trust Anchor. A valid trust path, including the given Entity Identifier, must be constructible from a matching credential.'
    )
  ),
})

const vTrustedAuthorities = [vAuthorityKeyIdentifier, vEtsiTrustedList, vOpenidFederation] as const

/**
 * Specifies trusted authorities within a requested Credential.
 */
export namespace DcqlTrustedAuthoritiesQuery {
  const vTrustedAuthoritiesQuery = vTrustedAuthorities.map((authority) =>
    v.object({
      type: v.pipe(
        authority.entries.type,
        v.description(
          'REQUIRED. A string uniquely identifying the type of information about the issuer trust framework.'
        )
      ),
      values: v.pipe(
        vNonEmptyArray(authority.entries.value),
        v.description(
          'REQUIRED. An array of strings, where each string (value) contains information specific to the used Trusted Authorities Query type that allows to identify an issuer, trust framework, or a federation that an issuer belongs to.'
        )
      ),
    })
  )

  export const vModel = v.variant('type', vTrustedAuthoritiesQuery)
  export type Input = v.InferInput<typeof vModel>
  export type Out = v.InferOutput<typeof vModel>
}
export type DcqlTrustedAuthoritiesQuery = DcqlTrustedAuthoritiesQuery.Out

/**
 * Specifies trusted authorities within a requested Credential.
 */
export namespace DcqlCredentialTrustedAuthority {
  export const vModel = v.variant('type', vTrustedAuthorities)
  export type Input = v.InferInput<typeof vModel>
  export type Out = v.InferOutput<typeof vModel>
}
export type DcqlCredentialTrustedAuthority = DcqlCredentialTrustedAuthority.Out
