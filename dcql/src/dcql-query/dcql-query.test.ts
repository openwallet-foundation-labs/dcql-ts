import assert from 'node:assert'
import { describe, expect, it } from 'vitest'
import { DcqlPresentationResult } from '../dcql-presentation/m-dcql-presentation-result.js'
import type { DcqlMdocCredential, DcqlSdJwtVcCredential, DcqlW3cVcCredential } from '../u-dcql-credential.js'
import { DcqlQuery } from './m-dcql-query.js'

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
      require_cryptographic_holder_binding: true,
      claims: [
        { path: ['org.iso.7367.1', 'vehicle_holder'], intent_to_retain: false },
        { path: ['org.iso.18013.5.1', 'first_name'], intent_to_retain: true },
      ],
      trusted_authorities: [
        {
          type: 'aki',
          values: ['one', 'two'],
        },
        {
          type: 'openid_federation',
          values: ['https://federation.com', 'https://agent.com'],
        },
      ],
    },
  ],
} satisfies DcqlQuery.Input

/**
 * The following is a non-normative example of a DCQL query that requests
 * a Verifiable Credential in the format mso_mdoc with the claims vehicle_holder and first_name
 * in the old syntax, leveraging `namespace` and `claim_name`
 */
const mdocNamespaceMvrcQuery = {
  credentials: [
    {
      id: 'my_credential',
      format: 'mso_mdoc' as const,
      meta: { doctype_value: 'org.iso.7367.1.mVRC' },
      claims: [
        { namespace: 'org.iso.7367.1', claim_name: 'vehicle_holder' },
        { namespace: 'org.iso.18013.5.1', claim_name: 'first_name' },
      ],
      require_cryptographic_holder_binding: false,
    },
  ],
} satisfies DcqlQuery.Input

const mdocMvrc = {
  credential_format: 'mso_mdoc',
  doctype: 'org.iso.7367.1.mVRC',
  namespaces: {
    'org.iso.7367.1': {
      vehicle_holder: 'Martin Auer',
      non_disclosed: 'secret',
    },
    'org.iso.18013.5.1': { first_name: 'Martin Auer' },
  },
  authority: {
    type: 'aki',
    values: ['one'],
  },
  cryptographic_holder_binding: true,
} satisfies DcqlMdocCredential

const exampleMdoc = {
  credential_format: 'mso_mdoc',
  doctype: 'example_doctype',
  namespaces: {
    example_namespaces: {
      example_claim: 'example_value',
    },
  },
  authority: {
    type: 'aki',
    values: ['something'],
  },
  cryptographic_holder_binding: true,
} satisfies DcqlMdocCredential

const sdJwtVcExampleQuery = {
  credentials: [
    {
      id: 'my_credential',
      format: 'vc+sd-jwt',
      meta: {
        vct_values: ['https://credentials.example.com/identity_credential'],
      },
      claims: [{ path: ['last_name'] }, { path: ['first_name'] }, { path: ['address', 'street_address'] }],
      require_cryptographic_holder_binding: false,
    },
  ],
} satisfies DcqlQuery.Input

const sdJwtVcMultipleExampleQuery = {
  credentials: [
    {
      id: 'my_credential',
      format: 'vc+sd-jwt',
      multiple: true,
      meta: {
        vct_values: ['https://credentials.example.com/identity_credential'],
      },
      claims: [{ path: ['last_name'] }, { path: ['first_name'] }, { path: ['address', 'street_address'] }],
      require_cryptographic_holder_binding: false,
    },
  ],
} satisfies DcqlQuery.Input

const exampleSdJwtVc = {
  credential_format: 'vc+sd-jwt',
  vct: 'https://credentials.example.com/identity_credential',
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
  cryptographic_holder_binding: false,
} satisfies DcqlSdJwtVcCredential

/**
 * The following is a non-normative example of a DCQL query that requests
 * a Verifiable Credential in the format mso_mdoc with the claims vehicle_holder and first_name:
 */
const w3cLdpVcQuery = {
  credentials: [
    {
      id: 'my_credential',
      format: 'ldp_vc',
      meta: {
        type_values: [
          ['https://example.org/examples#AlumniCredential', 'https://example.org/examples#BachelorDegree'],
          [
            'https://www.w3.org/2018/credentials#VerifiableCredential',
            'https://example.org/examples#UniversityDegreeCredential',
          ],
        ],
      },
      claims: [
        {
          path: ['last_name'],
        },
        { path: ['first_name'] },
        { path: ['address', 'street_address'] },
      ],
      require_cryptographic_holder_binding: false,
    },
  ],
} satisfies DcqlQuery.Input

const exampleW3cLdpVc = {
  credential_format: 'ldp_vc',
  type: [
    'https://www.w3.org/2018/credentials#VerifiableCredential',
    'https://example.org/examples#AlumniCredential',
    'https://example.org/examples#BachelorDegree',
  ],
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
  cryptographic_holder_binding: false,
} satisfies DcqlW3cVcCredential

describe('dcql-query', () => {
  it('mdoc mvrc query fails with invalid mdoc', (_t) => {
    const query = DcqlQuery.parse(mdocMvrcQuery)
    DcqlQuery.validate(query)

    const credentials = [exampleMdoc]
    const res = DcqlQuery.query(query, credentials)

    assert(!res.can_be_satisfied)
    assert.deepStrictEqual(res.credential_matches, {
      my_credential: {
        success: false,
        credential_query_id: 'my_credential',
        failed_credentials: [
          {
            success: false,
            input_credential_index: 0,
            trusted_authorities: {
              failed_trusted_authorities: [
                {
                  issues: {
                    values: [
                      "Expected one of the trusted authority values to be 'one' | 'two' but received 'something'",
                    ],
                  },
                  output: {
                    type: 'aki',
                    values: ['something'],
                  },
                  success: false,
                  trusted_authority_index: 0,
                },
                {
                  issues: {
                    type: ["Expected trusted authority type to be 'openid_federation' but received 'aki'"],
                    values: [
                      "Expected one of the trusted authority values to be 'https://federation.com' | 'https://agent.com' but received 'something'",
                    ],
                  },
                  output: {
                    type: 'aki',
                    values: ['something'],
                  },
                  success: false,
                  trusted_authority_index: 1,
                },
              ],
              success: false,
            },
            meta: {
              success: false,
              issues: {
                doctype: ["Expected doctype to be 'org.iso.7367.1.mVRC' but received 'example_doctype'"],
              },
              output: {
                cryptographic_holder_binding: true,
                credential_format: 'mso_mdoc',
                doctype: 'example_doctype',
              },
            },
            claims: {
              success: false,
              failed_claim_sets: [
                {
                  claim_set_index: undefined,
                  success: false,
                  failed_claim_indexes: [0, 1],
                  valid_claim_indexes: undefined,
                  issues: {
                    'org.iso.18013.5.1': ["Expected claim 'org.iso.18013.5.1'.'first_name' to be defined"],
                    'org.iso.7367.1': ["Expected claim 'org.iso.7367.1'.'vehicle_holder' to be defined"],
                  },
                },
              ],
              failed_claims: [
                {
                  success: false,
                  claim_id: undefined,
                  issues: {
                    'org.iso.7367.1': ["Expected claim 'org.iso.7367.1'.'vehicle_holder' to be defined"],
                  },
                  claim_index: 0,
                  output: {},
                },
                {
                  success: false,
                  claim_id: undefined,
                  issues: {
                    'org.iso.18013.5.1': ["Expected claim 'org.iso.18013.5.1'.'first_name' to be defined"],
                  },
                  claim_index: 1,
                  output: {},
                },
              ],
              valid_claims: undefined,
            },
          },
        ],
        valid_credentials: undefined,
      },
    })
  })

  it('mdoc mvrc example with multiple credentials succeeds', (_t) => {
    const query = DcqlQuery.parse(mdocMvrcQuery)
    DcqlQuery.validate(query)

    const res = DcqlQuery.query(query, [exampleMdoc, mdocMvrc])

    assert(res.can_be_satisfied)
    assert.deepStrictEqual(res.credential_matches, {
      my_credential: {
        success: true,
        credential_query_id: 'my_credential',
        failed_credentials: res.credential_matches.my_credential.failed_credentials,
        valid_credentials: [
          {
            claims: {
              failed_claim_sets: undefined,
              failed_claims: undefined,
              success: true,
              valid_claim_sets: [
                {
                  claim_set_index: undefined,
                  output: {
                    'org.iso.18013.5.1': {
                      first_name: 'Martin Auer',
                    },
                    'org.iso.7367.1': {
                      vehicle_holder: 'Martin Auer',
                    },
                  },
                  success: true,
                  valid_claim_indexes: [0, 1],
                },
              ],
              valid_claims: [
                {
                  claim_id: undefined,
                  claim_index: 0,
                  output: {
                    'org.iso.7367.1': {
                      vehicle_holder: 'Martin Auer',
                    },
                  },
                  success: true,
                },
                {
                  claim_id: undefined,
                  claim_index: 1,
                  output: {
                    'org.iso.18013.5.1': {
                      first_name: 'Martin Auer',
                    },
                  },
                  success: true,
                },
              ],
            },
            input_credential_index: 1,
            meta: {
              output: {
                credential_format: 'mso_mdoc',
                doctype: 'org.iso.7367.1.mVRC',
                cryptographic_holder_binding: true,
              },
              success: true,
            },
            success: true,
            trusted_authorities: {
              failed_trusted_authorities: undefined,
              success: true,
              valid_trusted_authority: {
                output: {
                  type: 'aki',
                  value: 'one',
                },
                success: true,
                trusted_authority_index: 0,
              },
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
            authority: {
              ...validCredential.trusted_authorities.valid_trusted_authority?.output,
              values: [validCredential.trusted_authorities.valid_trusted_authority?.output.value],
            },
            namespaces: validCredential.claims.valid_claim_sets[0].output,
          },
        ],
      },
      { dcqlQuery: query }
    )

    assert(presentationQueryResult.can_be_satisfied)
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
                  type: 'aki',
                  value: 'one',
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
              failed_claim_sets: undefined,
              valid_claim_sets: [
                {
                  success: true,
                  claim_set_index: undefined,
                  output: {
                    'org.iso.7367.1': {
                      vehicle_holder: 'Martin Auer',
                    },
                    'org.iso.18013.5.1': {
                      first_name: 'Martin Auer',
                    },
                  },
                  valid_claim_indexes: [0, 1],
                },
              ],
              valid_claims: [
                {
                  success: true,
                  claim_id: undefined,
                  claim_index: 0,
                  output: {
                    'org.iso.7367.1': {
                      vehicle_holder: 'Martin Auer',
                    },
                  },
                },
                {
                  success: true,
                  claim_index: 1,
                  claim_id: undefined,
                  output: {
                    'org.iso.18013.5.1': {
                      first_name: 'Martin Auer',
                    },
                  },
                },
              ],
              failed_claims: undefined,
            },
          },
        ],
      },
    })
  })

  it('w3cLdpVc example succeeds', (_t) => {
    const query = DcqlQuery.parse(w3cLdpVcQuery)
    DcqlQuery.validate(query)

    const credentials = [exampleW3cLdpVc]
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
            },
            meta: {
              success: true,
              output: {
                credential_format: 'ldp_vc',
                cryptographic_holder_binding: false,
                type: [
                  'https://www.w3.org/2018/credentials#VerifiableCredential',
                  'https://example.org/examples#AlumniCredential',
                  'https://example.org/examples#BachelorDegree',
                ],
              },
            },
            claims: {
              success: true,
              failed_claim_sets: undefined,
              valid_claim_sets: [
                {
                  success: true,
                  claim_set_index: undefined,
                  output: {
                    last_name: 'Dent',
                    first_name: 'Arthur',
                    address: {
                      street_address: '42 Market Street',
                    },
                  },
                  valid_claim_indexes: [0, 1, 2],
                },
              ],
              valid_claims: [
                {
                  success: true,
                  claim_id: undefined,
                  claim_index: 0,
                  output: {
                    last_name: 'Dent',
                  },
                },
                {
                  success: true,
                  claim_id: undefined,
                  claim_index: 1,
                  output: {
                    first_name: 'Arthur',
                  },
                },
                {
                  success: true,
                  claim_id: undefined,
                  claim_index: 2,
                  output: {
                    address: {
                      street_address: '42 Market Street',
                    },
                  },
                },
              ],
              failed_claims: undefined,
            },
          },
        ],
      },
    })
  })

  it('w3cLdpVc query fails with invalid type values', (_t) => {
    const query = DcqlQuery.parse(w3cLdpVcQuery)
    DcqlQuery.validate(query)

    const credentials = [
      {
        ...exampleW3cLdpVc,
        // Override type
        type: [
          'https://www.w3.org/2018/credentials#VerifiableCredential',
          'https://example.org/examples#AlumniCredential',
        ],
      },
    ]
    const res = DcqlQuery.query(query, credentials)

    assert(!res.can_be_satisfied)
    expect(res.credential_matches).toStrictEqual({
      my_credential: {
        success: false,
        credential_query_id: 'my_credential',
        valid_credentials: undefined,
        failed_credentials: [
          {
            success: false,
            input_credential_index: 0,
            trusted_authorities: {
              success: true,
            },
            meta: {
              success: false,
              issues: {
                type: [
                  'Expected type to include all values from one of the following subsets: [https://example.org/examples#AlumniCredential, https://example.org/examples#BachelorDegree] | [https://www.w3.org/2018/credentials#VerifiableCredential, https://example.org/examples#UniversityDegreeCredential]',
                ],
              },
              output: {
                credential_format: 'ldp_vc',
                cryptographic_holder_binding: false,
                type: [
                  'https://www.w3.org/2018/credentials#VerifiableCredential',
                  'https://example.org/examples#AlumniCredential',
                ],
              },
            },
            claims: {
              success: true,
              failed_claim_sets: undefined,
              valid_claim_sets: [
                {
                  success: true,
                  claim_set_index: undefined,
                  output: {
                    last_name: 'Dent',
                    first_name: 'Arthur',
                    address: {
                      street_address: '42 Market Street',
                    },
                  },
                  valid_claim_indexes: [0, 1, 2],
                },
              ],
              valid_claims: [
                {
                  success: true,
                  claim_id: undefined,
                  claim_index: 0,
                  output: {
                    last_name: 'Dent',
                  },
                },
                {
                  success: true,
                  claim_id: undefined,
                  claim_index: 1,
                  output: {
                    first_name: 'Arthur',
                  },
                },
                {
                  success: true,
                  claim_id: undefined,
                  claim_index: 2,
                  output: {
                    address: {
                      street_address: '42 Market Street',
                    },
                  },
                },
              ],
              failed_claims: undefined,
            },
          },
        ],
      },
    })
  })

  it('mdocMvrc example using namespaces succeeds', (_t) => {
    const query = DcqlQuery.parse(mdocNamespaceMvrcQuery)
    DcqlQuery.validate(query)

    const credentials = [mdocMvrc]
    const res = DcqlQuery.query(query, credentials)

    assert(res.can_be_satisfied)
    expect(res.credential_matches.my_credential.valid_credentials?.length).toEqual(1)
  })

  it('sdJwtVc example with multiple credentials succeeds', (_t) => {
    const query = DcqlQuery.parse(sdJwtVcExampleQuery)
    DcqlQuery.validate(query)

    const res = DcqlQuery.query(query, [exampleMdoc, exampleSdJwtVc])

    assert(res.can_be_satisfied)
    expect(res.credential_matches.my_credential.valid_credentials?.length).toEqual(1)
    expect(res.credential_matches.my_credential.failed_credentials?.length).toEqual(1)
  })

  it("sdJwtVc with 'multiple' set to true succeeds", (_t) => {
    const query = DcqlQuery.parse(sdJwtVcMultipleExampleQuery)
    DcqlQuery.validate(query)

    // We add the same credential twice
    const res = DcqlQuery.query(query, [exampleSdJwtVc, exampleSdJwtVc])

    assert(res.can_be_satisfied)

    const match = {
      success: true,
      input_credential_index: 0,
      trusted_authorities: {
        success: true,
      },
      meta: {
        success: true,
        output: {
          credential_format: 'vc+sd-jwt',
          cryptographic_holder_binding: false,
          vct: 'https://credentials.example.com/identity_credential',
        },
      },
      claims: {
        success: true,
        failed_claim_sets: undefined,
        valid_claim_sets: [
          {
            success: true,
            claim_set_index: undefined,
            output: {
              last_name: 'Dent',
              first_name: 'Arthur',
              address: {
                street_address: '42 Market Street',
              },
            },
            valid_claim_indexes: [0, 1, 2],
          },
        ],
        valid_claims: [
          {
            success: true,
            claim_id: undefined,
            claim_index: 0,
            output: {
              last_name: 'Dent',
            },
          },
          {
            success: true,
            claim_id: undefined,
            claim_index: 1,
            output: {
              first_name: 'Arthur',
            },
          },
          {
            success: true,
            claim_id: undefined,
            claim_index: 2,
            output: {
              address: {
                street_address: '42 Market Street',
              },
            },
          },
        ],
        failed_claims: undefined,
      },
    } as const
    assert.deepStrictEqual(res.credential_matches, {
      my_credential: {
        success: true,
        credential_query_id: 'my_credential',
        failed_credentials: undefined,

        // Match should be same except for credential index
        valid_credentials: [match, { ...match, input_credential_index: 1 }],
      },
    } as const)

    const presentationQueryResult = DcqlPresentationResult.fromDcqlPresentation(
      {
        my_credential: [exampleSdJwtVc, exampleSdJwtVc],
      },
      { dcqlQuery: query }
    )

    expect(presentationQueryResult.can_be_satisfied).toBe(true)
    expect(presentationQueryResult.credential_matches.my_credential.valid_credentials?.length).toEqual(2)
  })

  it("sdJwtVc with 'multiple' set to true but only one credential in the presentation matches", (_t) => {
    const query = DcqlQuery.parse(sdJwtVcMultipleExampleQuery)
    DcqlQuery.validate(query)

    // We add the same credential twice
    const res = DcqlQuery.query(query, [exampleSdJwtVc, exampleSdJwtVc])

    assert(res.can_be_satisfied)

    const presentationQueryResult = DcqlPresentationResult.fromDcqlPresentation(
      {
        my_credential: [exampleSdJwtVc, exampleMdoc],
      },
      { dcqlQuery: query }
    )
    expect(presentationQueryResult.can_be_satisfied).toBe(false)
  })
})
