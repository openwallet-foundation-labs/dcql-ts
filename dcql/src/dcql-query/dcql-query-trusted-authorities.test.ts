import assert from 'node:assert'
import { describe, it } from 'vitest'
import { DcqlPresentationResult } from '../dcql-presentation/m-dcql-presentation-result.js'
import type { DcqlMdocCredential, DcqlSdJwtVcCredential } from '../u-dcql-credential.js'
import { DcqlQuery } from './m-dcql-query.js'
import type { DcqlCredentialTrustedAuthority } from './m-dcql-trusted-authorities.js'

const etsiTlAuthority = {
  type: 'etsi_tl',
  values: ['https://list.com'],
} satisfies DcqlCredentialTrustedAuthority

const openidFederationAuthority = {
  type: 'openid_federation',
  values: ['https://federation.com'],
} satisfies DcqlCredentialTrustedAuthority

const akiAuthority = {
  type: 'aki',
  values: ['s9tIpPmhxdiuNkHMEWNpYim8S8Y'],
} satisfies DcqlCredentialTrustedAuthority

/**
 * The following is a non-normative example of a DCQL query that requests
 * a Verifiable Credential in the format mso_mdoc with the claims vehicle_holder and first_name:
 */
const mdocMvrcQuery = {
  credentials: [
    {
      id: 'my_credential',
      format: 'mso_mdoc',
      trusted_authorities: [
        {
          type: 'aki',
          values: ['s9tIpPmhxdiuNkHMEWNpYim8S8Y', 'UVVJUkVELiBBIHN0cmluZyB1bmlxdWVseSBpZGVudGlmeWluZyB0aGUgdHlwZSA'],
        },
      ],
    },
  ],
} satisfies DcqlQuery.Input

const mdocMvrc = {
  credential_format: 'mso_mdoc',
  doctype: 'org.iso.7367.1.mVRC',
  authority: akiAuthority,
  namespaces: {
    'org.iso.7367.1': {
      vehicle_holder: 'Martin Auer',
      non_disclosed: 'secret',
    },
    'org.iso.18013.5.1': { first_name: 'Martin Auer' },
  },
  cryptographic_holder_binding: true,
} satisfies DcqlMdocCredential

const _exampleMdoc = {
  credential_format: 'mso_mdoc',
  doctype: 'example_doctype',
  namespaces: {
    example_namespaces: {
      example_claim: 'example_value',
    },
  },
  cryptographic_holder_binding: true,
} satisfies DcqlMdocCredential

const sdJwtVcExampleQuery = {
  credentials: [
    {
      id: 'my_credential',
      format: 'vc+sd-jwt',
      trusted_authorities: [
        {
          type: 'etsi_tl',
          values: ['https://list.com'],
        },
        {
          type: 'openid_federation',
          values: ['https://federation.com'],
        },
      ],
    },
  ],
} satisfies DcqlQuery.Input

const sdJwtVc = {
  credential_format: 'vc+sd-jwt',
  vct: 'https://credentials.example.com/identity_credential',
  authority: etsiTlAuthority,
  claims: {
    first_name: 'Arthur',
    last_name: 'Dent',
    address: {
      street_address: '42 Market Street',
      locality: 'Milliways',
      postal_code: '12345',
    },
    degrees: [
      {
        type: 'Bachelor of Science',
        university: 'University of Betelgeuse',
      },
      {
        type: 'Master of Science',
        university: 'University of Betelgeuse',
      },
    ],
    nationalities: ['British', 'Betelgeusian'],
  },
  cryptographic_holder_binding: true,
} satisfies DcqlSdJwtVcCredential

describe('dcql-query trusted authorities', () => {
  it('mdocMvrc example with trusted_authorities succeeds', (_t) => {
    const query = DcqlQuery.parse(mdocMvrcQuery)
    DcqlQuery.validate(query)

    const credentials = [mdocMvrc]
    const res = DcqlQuery.query(query, credentials)

    assert(res.can_be_satisfied)
    assert.deepStrictEqual(res.credential_matches, {
      my_credential: {
        success: true,
        credential_query_id: 'my_credential',
        failed_credentials: undefined,
        valid_credentials: [
          {
            success: true,
            input_credential_index: 0,
            trusted_authorities: {
              success: true,
              valid_trusted_authority: {
                success: true,
                trusted_authority_index: 0,
                output: {
                  type: 'aki',
                  value: 's9tIpPmhxdiuNkHMEWNpYim8S8Y',
                },
              },
              failed_trusted_authorities: undefined,
            },
            meta: {
              success: true,
              output: {
                credential_format: 'mso_mdoc',
                doctype: 'org.iso.7367.1.mVRC',
                cryptographic_holder_binding: true,
              },
            },
            claims: {
              success: true,
              valid_claims: undefined,
              failed_claims: undefined,
              valid_claim_sets: [
                {
                  claim_set_index: undefined,
                  output: {},
                  success: true,
                  valid_claim_indexes: undefined,
                },
              ],
              failed_claim_sets: undefined,
            },
          },
        ],
      },
    } as const)

    const validCredential = res.credential_matches.my_credential.valid_credentials[0]
    const presentationQueryResult = DcqlPresentationResult.fromDcqlPresentation(
      {
        my_credential: [
          {
            ...validCredential.meta.output,
            namespaces: validCredential.claims.valid_claim_sets[0].output,
            authority: {
              ...validCredential.trusted_authorities.valid_trusted_authority.output,
              values: [validCredential.trusted_authorities.valid_trusted_authority.output.value],
            },
          },
        ],
      },
      { dcqlQuery: query }
    )

    assert.deepStrictEqual(presentationQueryResult.credential_matches, {
      my_credential: {
        success: true,
        credential_query_id: 'my_credential',
        failed_credentials: undefined,
        valid_credentials: [
          {
            success: true,
            input_credential_index: 0,
            trusted_authorities: {
              success: true,
              valid_trusted_authority: {
                success: true,
                trusted_authority_index: 0,
                output: { type: 'aki', value: 's9tIpPmhxdiuNkHMEWNpYim8S8Y' },
              },
              failed_trusted_authorities: undefined,
            },
            meta: {
              success: true,
              output: {
                credential_format: 'mso_mdoc',
                doctype: 'org.iso.7367.1.mVRC',
                cryptographic_holder_binding: true,
              },
            },
            claims: {
              success: true,
              valid_claims: undefined,
              failed_claims: undefined,
              valid_claim_sets: [
                {
                  output: {},
                  success: true,
                  valid_claim_indexes: undefined,
                  claim_set_index: undefined,
                },
              ],
              failed_claim_sets: undefined,
            },
          },
        ],
      },
    })
  })

  it('mdocMvrc example where authority does not match trusted_authorities entry', (_t) => {
    const query = DcqlQuery.parse(mdocMvrcQuery)
    DcqlQuery.validate(query)

    const credentials = [{ ...mdocMvrc, authority: openidFederationAuthority }]
    const res = DcqlQuery.query(query, credentials)

    assert(!res.can_be_satisfied)
    assert.deepStrictEqual(res.credential_matches, {
      my_credential: {
        success: false,
        credential_query_id: 'my_credential',
        valid_credentials: undefined,
        failed_credentials: [
          {
            success: false,
            input_credential_index: 0,
            trusted_authorities: {
              success: false,
              failed_trusted_authorities: [
                {
                  success: false,
                  trusted_authority_index: 0,
                  issues: {
                    type: ["Expected trusted authority type to be 'aki' but received 'openid_federation'"],
                    values: [
                      "Expected one of the trusted authority values to be 's9tIpPmhxdiuNkHMEWNpYim8S8Y' | 'UVVJUkVELiBBIHN0cmluZyB1bmlxdWVseSBpZGVudGlmeWluZyB0aGUgdHlwZSA' but received 'https://federation.com'",
                    ],
                  },
                  output: {
                    type: 'openid_federation',
                    values: ['https://federation.com'],
                  },
                },
              ],
            },
            meta: {
              success: true,
              output: {
                credential_format: 'mso_mdoc',
                doctype: 'org.iso.7367.1.mVRC',
                cryptographic_holder_binding: true,
              },
            },
            claims: {
              success: true,
              valid_claims: undefined,
              failed_claims: undefined,
              valid_claim_sets: [
                {
                  claim_set_index: undefined,
                  output: {},
                  success: true,
                  valid_claim_indexes: undefined,
                },
              ],
              failed_claim_sets: undefined,
            },
          },
        ],
      },
    })

    const presentationQueryResult = DcqlPresentationResult.fromDcqlPresentation(
      { my_credential: { ...mdocMvrc, authority: openidFederationAuthority } },
      { dcqlQuery: query }
    )

    assert(!presentationQueryResult.can_be_satisfied)
    assert.deepStrictEqual(presentationQueryResult.credential_matches, {
      my_credential: {
        success: false,
        credential_query_id: 'my_credential',
        valid_credentials: undefined,
        failed_credentials: [
          {
            success: false,
            input_credential_index: 0,
            trusted_authorities: {
              success: false,
              failed_trusted_authorities: [
                {
                  success: false,
                  trusted_authority_index: 0,
                  issues: {
                    type: ["Expected trusted authority type to be 'aki' but received 'openid_federation'"],
                    values: [
                      "Expected one of the trusted authority values to be 's9tIpPmhxdiuNkHMEWNpYim8S8Y' | 'UVVJUkVELiBBIHN0cmluZyB1bmlxdWVseSBpZGVudGlmeWluZyB0aGUgdHlwZSA' but received 'https://federation.com'",
                    ],
                  },
                  output: {
                    type: 'openid_federation',
                    values: ['https://federation.com'],
                  },
                },
              ],
            },
            meta: {
              success: true,
              output: {
                credential_format: 'mso_mdoc',
                doctype: 'org.iso.7367.1.mVRC',
                cryptographic_holder_binding: true,
              },
            },
            claims: {
              success: true,
              valid_claims: undefined,
              failed_claims: undefined,
              valid_claim_sets: [
                {
                  claim_set_index: undefined,
                  output: {},
                  success: true,
                  valid_claim_indexes: undefined,
                },
              ],
              failed_claim_sets: undefined,
            },
          },
        ],
      },
    })
  })

  it('mdocMvrc example where trusted_authorities is present but no authority', (_t) => {
    const query = DcqlQuery.parse(mdocMvrcQuery)
    DcqlQuery.validate(query)

    const credentials = [{ ...mdocMvrc, authority: undefined }]
    const res = DcqlQuery.query(query, credentials)

    assert(!res.can_be_satisfied)
    assert.deepStrictEqual(res.credential_matches, {
      my_credential: {
        success: false,
        credential_query_id: 'my_credential',
        valid_credentials: undefined,
        failed_credentials: [
          {
            success: false,
            input_credential_index: 0,
            trusted_authorities: {
              success: false,
              failed_trusted_authorities: [
                {
                  success: false,
                  trusted_authority_index: 0,
                  issues: {
                    root: ["Expected trusted authority object with type 'aki' to be defined, but received undefined"],
                  },
                  output: undefined,
                },
              ],
            },
            meta: {
              success: true,
              output: {
                credential_format: 'mso_mdoc',
                doctype: 'org.iso.7367.1.mVRC',
                cryptographic_holder_binding: true,
              },
            },
            claims: {
              success: true,
              valid_claims: undefined,
              failed_claims: undefined,
              valid_claim_sets: [
                {
                  claim_set_index: undefined,
                  output: {},
                  success: true,
                  valid_claim_indexes: undefined,
                },
              ],
              failed_claim_sets: undefined,
            },
          },
        ],
      },
    })

    const presentationQueryResult = DcqlPresentationResult.fromDcqlPresentation(
      { my_credential: { ...mdocMvrc, authority: undefined } },
      { dcqlQuery: query }
    )

    assert(!presentationQueryResult.can_be_satisfied)
    assert.deepStrictEqual(presentationQueryResult.credential_matches, {
      my_credential: {
        success: false,
        credential_query_id: 'my_credential',
        valid_credentials: undefined,
        failed_credentials: [
          {
            success: false,
            input_credential_index: 0,
            trusted_authorities: {
              success: false,
              failed_trusted_authorities: [
                {
                  success: false,
                  trusted_authority_index: 0,
                  issues: {
                    root: ["Expected trusted authority object with type 'aki' to be defined, but received undefined"],
                  },
                  output: undefined,
                },
              ],
            },
            meta: {
              success: true,
              output: {
                credential_format: 'mso_mdoc',
                doctype: 'org.iso.7367.1.mVRC',
                cryptographic_holder_binding: true,
              },
            },
            claims: {
              success: true,
              valid_claims: undefined,
              failed_claims: undefined,
              valid_claim_sets: [
                {
                  claim_set_index: undefined,
                  output: {},
                  success: true,
                  valid_claim_indexes: undefined,
                },
              ],
              failed_claim_sets: undefined,
            },
          },
        ],
      },
    })
  })

  it('sdJwtVc example with trusted_authorities succeeds', (_t) => {
    const query = DcqlQuery.parse(sdJwtVcExampleQuery)
    DcqlQuery.validate(query)

    const res = DcqlQuery.query(query, [sdJwtVc])

    assert(res.can_be_satisfied)
    assert.deepStrictEqual(res.credential_matches, {
      my_credential: {
        success: true,
        credential_query_id: 'my_credential',
        failed_credentials: undefined,
        valid_credentials: [
          {
            success: true,
            input_credential_index: 0,
            trusted_authorities: {
              success: true,
              valid_trusted_authority: {
                success: true,
                trusted_authority_index: 0,
                output: {
                  type: 'etsi_tl',
                  value: 'https://list.com',
                },
              },
              failed_trusted_authorities: undefined,
            },
            meta: {
              success: true,
              output: {
                credential_format: 'vc+sd-jwt',
                cryptographic_holder_binding: true,
                vct: 'https://credentials.example.com/identity_credential',
              },
            },
            claims: {
              success: true,
              valid_claims: undefined,
              failed_claims: undefined,
              valid_claim_sets: [
                {
                  claim_set_index: undefined,
                  output: {},
                  success: true,
                  valid_claim_indexes: undefined,
                },
              ],
              failed_claim_sets: undefined,
            },
          },
        ],
      },
    } as const)

    const validCredential = res.credential_matches.my_credential.valid_credentials[0]
    const presentationQueryResult = DcqlPresentationResult.fromDcqlPresentation(
      {
        my_credential: [
          {
            ...validCredential.meta.output,
            claims: validCredential.claims.valid_claim_sets[0].output,
            authority: {
              ...validCredential.trusted_authorities.valid_trusted_authority.output,
              values: [validCredential.trusted_authorities.valid_trusted_authority.output.value],
            },
          },
        ],
      },
      { dcqlQuery: query }
    )

    assert.deepStrictEqual(presentationQueryResult.credential_matches, {
      my_credential: {
        success: true,
        credential_query_id: 'my_credential',
        failed_credentials: undefined,
        valid_credentials: [
          {
            success: true,
            input_credential_index: 0,
            trusted_authorities: {
              success: true,
              valid_trusted_authority: {
                success: true,
                trusted_authority_index: 0,
                output: {
                  type: 'etsi_tl',
                  value: 'https://list.com',
                },
              },
              failed_trusted_authorities: undefined,
            },
            meta: {
              success: true,
              output: {
                cryptographic_holder_binding: true,
                credential_format: 'vc+sd-jwt',
                vct: 'https://credentials.example.com/identity_credential',
              },
            },
            claims: {
              success: true,
              valid_claims: undefined,
              failed_claims: undefined,
              valid_claim_sets: [
                {
                  output: {},
                  success: true,
                  valid_claim_indexes: undefined,
                  claim_set_index: undefined,
                },
              ],
              failed_claim_sets: undefined,
            },
          },
        ],
      },
    })
  })
})
