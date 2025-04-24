import assert from 'node:assert'
import { describe, expect, it } from 'vitest'
import { DcqlPresentationResult } from '../dcql-presentation/m-dcql-presentation-result.js'
import type { DcqlMdocCredential, DcqlSdJwtVcCredential } from '../u-dcql-credential.js'
import { DcqlQuery } from './m-dcql-query.js'

const etsiTlAuthority = {
  type: 'etsi_tl',
  value: 'https://list.com',
} as const

const openidFederationAuthority = {
  type: 'openid_federation',
  value: 'https://federation.com',
} as const

const akiAuthority = {
  type: 'aki',
  value: 's9tIpPmhxdiuNkHMEWNpYim8S8Y',
} as const

/**
 * The following is a non-normative example of a DCQL query that requests
 * a Verifiable Credential in the format mso_mdoc with the claims vehicle_holder and first_name:
 */
const mdocMvrcQuery = {
  credentials: [
    {
      id: 'my_credential',
      format: 'mso_mdoc' as const,
      meta: { doctype_value: 'org.iso.7367.1.mVRC' },
      trusted_authorities: [
        {
          type: 'aki',
          values: ['s9tIpPmhxdiuNkHMEWNpYim8S8Y', 'UVVJUkVELiBBIHN0cmluZyB1bmlxdWVseSBpZGVudGlmeWluZyB0aGUgdHlwZSA'],
        },
      ],
      claims: [
        { path: ['org.iso.7367.1', 'vehicle_holder'], intent_to_retain: false },
        { path: ['org.iso.18013.5.1', 'first_name'], intent_to_retain: true },
      ],
    },
  ],
} satisfies DcqlQuery

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
} satisfies DcqlMdocCredential

const exampleMdoc = {
  credential_format: 'mso_mdoc',
  doctype: 'example_doctype',
  namespaces: {
    example_namespaces: {
      example_claim: 'example_value',
    },
  },
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
      meta: {
        vct_values: ['https://credentials.example.com/identity_credential'],
      },
      claims: [{ path: ['last_name'] }, { path: ['first_name'] }, { path: ['address', 'street_address'] }],
    },
  ],
} satisfies DcqlQuery

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
} satisfies DcqlSdJwtVcCredential

describe('dcql-query trusted authorities', () => {
  it('mdocMvrc example with trusted_authorities succeeds', (_t) => {
    const query = DcqlQuery.parse(mdocMvrcQuery)
    DcqlQuery.validate(query)

    const credentials = [mdocMvrc]
    const res = DcqlQuery.query(query, credentials)

    assert(res.canBeSatisfied)

    assert.deepStrictEqual(res.credential_matches, {
      my_credential: {
        success: true,
        typed: true,
        input_credential_index: 0,
        claim_set_index: undefined,
        output: {
          credential_format: 'mso_mdoc' as const,
          doctype: 'org.iso.7367.1.mVRC',
          authority: {
            type: 'aki',
            value: 's9tIpPmhxdiuNkHMEWNpYim8S8Y',
          } as const,
          namespaces: {
            'org.iso.7367.1': { vehicle_holder: 'Martin Auer' },
            'org.iso.18013.5.1': { first_name: 'Martin Auer' },
          },
        },

        all: res.credential_matches.my_credential?.all,
      },
    })

    const presentationQueryResult = DcqlPresentationResult.fromDcqlPresentation(
      { my_credential: res.credential_matches.my_credential.output },
      { dcqlQuery: query }
    )

    assert.deepStrictEqual(presentationQueryResult.valid_matches, {
      my_credential: {
        success: true,
        typed: true,
        presentation_id: 'my_credential',
        claim_set_index: undefined,
        output: {
          credential_format: 'mso_mdoc' as const,
          doctype: 'org.iso.7367.1.mVRC',
          authority: {
            type: 'aki',
            value: 's9tIpPmhxdiuNkHMEWNpYim8S8Y',
          },
          namespaces: {
            'org.iso.7367.1': { vehicle_holder: 'Martin Auer' },
            'org.iso.18013.5.1': { first_name: 'Martin Auer' },
          },
        },
      },
    })
  })

  it('mdocMvrc example where authority does not match trusted_authorities entry', (_t) => {
    const query = DcqlQuery.parse(mdocMvrcQuery)
    DcqlQuery.validate(query)

    const credentials = [{ ...mdocMvrc, authority: openidFederationAuthority }]
    const res = DcqlQuery.query(query, credentials)

    assert(!res.canBeSatisfied)

    expect(res.credential_matches).toStrictEqual({
      my_credential: {
        success: false,

        all: [
          [
            {
              claim_set_index: undefined,
              flattened: {
                nested: {
                  'authority.type': [
                    "Credential query 'my_credential' requires the credential to be issued by a trusted authority of type aki, but none of the type or values match.",
                  ],
                },
              },
              input_credential_index: 0,
              issues: [
                {
                  abortEarly: undefined,
                  abortPipeEarly: undefined,
                  expected: '"aki"',
                  input: 'openid_federation',
                  issues: undefined,
                  kind: 'schema',
                  lang: undefined,
                  message:
                    "Credential query 'my_credential' requires the credential to be issued by a trusted authority of type aki, but none of the type or values match.",
                  path: [
                    {
                      input: {
                        authority: {
                          type: 'openid_federation',
                          value: 'https://federation.com',
                        },
                        credential_format: 'mso_mdoc',
                        doctype: 'org.iso.7367.1.mVRC',
                        namespaces: {
                          'org.iso.18013.5.1': {
                            first_name: 'Martin Auer',
                          },
                          'org.iso.7367.1': {
                            non_disclosed: 'secret',
                            vehicle_holder: 'Martin Auer',
                          },
                        },
                      },
                      key: 'authority',
                      origin: 'value',
                      type: 'object',
                      value: {
                        type: 'openid_federation',
                        value: 'https://federation.com',
                      },
                    },
                    {
                      input: {
                        type: 'openid_federation',
                        value: 'https://federation.com',
                      },
                      key: 'type',
                      origin: 'value',
                      type: 'object',
                      value: 'openid_federation',
                    },
                  ],
                  received: '"openid_federation"',
                  requirement: undefined,
                  type: 'variant',
                },
              ],
              output: {
                authority: {
                  type: 'openid_federation',
                  value: 'https://federation.com',
                } as const,
                credential_format: 'mso_mdoc',
                doctype: 'org.iso.7367.1.mVRC',
                namespaces: {
                  'org.iso.18013.5.1': {
                    first_name: 'Martin Auer',
                  },
                  'org.iso.7367.1': {
                    vehicle_holder: 'Martin Auer',
                  },
                },
              },
              success: false,
              typed: false,
            },
          ],
        ],
      },
    })

    const presentationQueryResult = DcqlPresentationResult.fromDcqlPresentation(
      { my_credential: { ...mdocMvrc, authority: openidFederationAuthority } },
      { dcqlQuery: query }
    )

    assert.deepStrictEqual(presentationQueryResult.invalid_matches, {
      my_credential: {
        success: false,
        typed: false,
        presentation_id: 'my_credential',
        claim_set_index: undefined,
        flattened: {
          nested: {
            'authority.type': [
              "Credential query 'my_credential' requires the credential to be issued by a trusted authority of type aki, but none of the type or values match.",
            ],
          },
        },
        issues: [
          {
            abortEarly: undefined,
            abortPipeEarly: undefined,
            expected: '"aki"',
            input: 'openid_federation',
            issues: undefined,
            kind: 'schema',
            lang: undefined,
            message:
              "Credential query 'my_credential' requires the credential to be issued by a trusted authority of type aki, but none of the type or values match.",
            path: [
              {
                input: {
                  authority: {
                    type: 'openid_federation',
                    value: 'https://federation.com',
                  },
                  credential_format: 'mso_mdoc',
                  doctype: 'org.iso.7367.1.mVRC',
                  namespaces: {
                    'org.iso.18013.5.1': {
                      first_name: 'Martin Auer',
                    },
                    'org.iso.7367.1': {
                      non_disclosed: 'secret',
                      vehicle_holder: 'Martin Auer',
                    },
                  },
                },
                key: 'authority',
                origin: 'value',
                type: 'object',
                value: {
                  type: 'openid_federation',
                  value: 'https://federation.com',
                },
              },
              {
                input: {
                  type: 'openid_federation',
                  value: 'https://federation.com',
                },
                key: 'type',
                origin: 'value',
                type: 'object',
                value: 'openid_federation',
              },
            ],
            received: '"openid_federation"',
            requirement: undefined,
            type: 'variant',
          },
        ],
        output: {
          credential_format: 'mso_mdoc' as const,
          doctype: 'org.iso.7367.1.mVRC',
          authority: openidFederationAuthority,
          namespaces: {
            'org.iso.7367.1': { vehicle_holder: 'Martin Auer' },
            'org.iso.18013.5.1': { first_name: 'Martin Auer' },
          },
        },
      },
    })
  })

  it('mdocMvrc example where trusted_authorities is present but no authority', (_t) => {
    const query = DcqlQuery.parse(mdocMvrcQuery)
    DcqlQuery.validate(query)

    const credentials = [{ ...mdocMvrc, authority: undefined }]
    const res = DcqlQuery.query(query, credentials)

    assert(!res.canBeSatisfied)

    expect(res.credential_matches).toStrictEqual({
      my_credential: {
        success: false,

        all: [
          [
            {
              claim_set_index: undefined,
              flattened: {
                nested: {
                  authority: [
                    "Credential query 'my_credential' requires the credential to be issued by a trusted authority of type aki, but none of the type or values match.",
                  ],
                },
              },
              input_credential_index: 0,
              issues: [
                {
                  abortEarly: undefined,
                  abortPipeEarly: undefined,
                  expected: 'Object',
                  input: undefined,
                  issues: undefined,
                  kind: 'schema',
                  lang: undefined,
                  message:
                    "Credential query 'my_credential' requires the credential to be issued by a trusted authority of type aki, but none of the type or values match.",
                  path: [
                    {
                      input: {
                        authority: undefined,
                        credential_format: 'mso_mdoc',
                        doctype: 'org.iso.7367.1.mVRC',
                        namespaces: {
                          'org.iso.18013.5.1': {
                            first_name: 'Martin Auer',
                          },
                          'org.iso.7367.1': {
                            non_disclosed: 'secret',
                            vehicle_holder: 'Martin Auer',
                          },
                        },
                      },
                      key: 'authority',
                      origin: 'value',
                      type: 'object',
                      value: undefined,
                    },
                  ],
                  received: 'undefined',
                  requirement: undefined,
                  type: 'variant',
                },
              ],
              output: {
                authority: undefined,
                credential_format: 'mso_mdoc',
                doctype: 'org.iso.7367.1.mVRC',
                namespaces: {
                  'org.iso.18013.5.1': {
                    first_name: 'Martin Auer',
                  },
                  'org.iso.7367.1': {
                    vehicle_holder: 'Martin Auer',
                  },
                },
              },
              success: false,
              typed: false,
            },
          ],
        ],
      },
    })

    const presentationQueryResult = DcqlPresentationResult.fromDcqlPresentation(
      { my_credential: { ...mdocMvrc, authority: undefined } },
      { dcqlQuery: query }
    )

    assert.deepStrictEqual(presentationQueryResult.invalid_matches, {
      my_credential: {
        success: false,
        typed: false,
        presentation_id: 'my_credential',
        claim_set_index: undefined,
        flattened: {
          nested: {
            authority: [
              "Credential query 'my_credential' requires the credential to be issued by a trusted authority of type aki, but none of the type or values match.",
            ],
          },
        },
        issues: [
          {
            abortEarly: undefined,
            abortPipeEarly: undefined,
            expected: 'Object',
            input: undefined,
            issues: undefined,
            kind: 'schema',
            lang: undefined,
            message:
              "Credential query 'my_credential' requires the credential to be issued by a trusted authority of type aki, but none of the type or values match.",
            path: [
              {
                input: {
                  authority: undefined,
                  credential_format: 'mso_mdoc',
                  doctype: 'org.iso.7367.1.mVRC',
                  namespaces: {
                    'org.iso.18013.5.1': {
                      first_name: 'Martin Auer',
                    },
                    'org.iso.7367.1': {
                      non_disclosed: 'secret',
                      vehicle_holder: 'Martin Auer',
                    },
                  },
                },
                key: 'authority',
                origin: 'value',
                type: 'object',
                value: undefined,
              },
            ],
            received: 'undefined',
            requirement: undefined,
            type: 'variant',
          },
        ],
        output: {
          credential_format: 'mso_mdoc' as const,
          doctype: 'org.iso.7367.1.mVRC',
          authority: undefined,
          namespaces: {
            'org.iso.7367.1': { vehicle_holder: 'Martin Auer' },
            'org.iso.18013.5.1': { first_name: 'Martin Auer' },
          },
        },
      },
    })
  })

  it('sdJwtVc example with trusted_authorities succeeds', (_t) => {
    const query = DcqlQuery.parse(sdJwtVcExampleQuery)
    DcqlQuery.validate(query)

    const res = DcqlQuery.query(query, [exampleMdoc, sdJwtVc])

    assert(res.canBeSatisfied)
    assert.deepStrictEqual(res.credential_matches, {
      my_credential: {
        success: true,
        typed: true,
        input_credential_index: 1,
        claim_set_index: undefined,

        output: {
          credential_format: 'vc+sd-jwt' as const,
          authority: {
            type: 'etsi_tl',
            value: 'https://list.com',
          } as const,
          vct: 'https://credentials.example.com/identity_credential',
          claims: {
            first_name: 'Arthur',
            last_name: 'Dent',
            address: {
              street_address: '42 Market Street',
            },
          },
        },
        all: res.credential_matches.my_credential?.all,
      },
    })

    const presentationQueryResult = DcqlPresentationResult.fromDcqlPresentation(
      { my_credential: res.credential_matches.my_credential.output },
      { dcqlQuery: query }
    )

    assert.deepStrictEqual(presentationQueryResult.valid_matches, {
      my_credential: {
        success: true,
        typed: true,
        presentation_id: 'my_credential',
        claim_set_index: undefined,
        output: {
          credential_format: 'vc+sd-jwt' as const,
          authority: {
            type: 'etsi_tl',
            value: 'https://list.com',
          },
          vct: 'https://credentials.example.com/identity_credential',
          claims: {
            first_name: 'Arthur',
            last_name: 'Dent',
            address: {
              street_address: '42 Market Street',
            },
          },
        },
      },
    })
  })
})
