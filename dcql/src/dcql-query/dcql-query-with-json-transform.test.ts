import assert from 'node:assert'
import { describe, it } from 'vitest'
import { DcqlPresentationResult } from '../dcql-presentation/m-dcql-presentation-result.js'
import type { DcqlMdocCredential, DcqlSdJwtVcCredential } from '../u-dcql-credential.js'
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
      meta: {
        doctype_value: 'org.iso.7367.1.mVRC',
      },
      claims: [
        {
          namespace: 'org.iso.7367.1',
          claim_name: 'vehicle_holder',
        },
        {
          namespace: 'org.iso.18013.5.1',
          claim_name: 'first_name',
        },
      ],
    },
  ],
} satisfies DcqlQuery.Input

const sdJwtVcExampleQuery = {
  credentials: [
    {
      id: 'my_credential',
      format: 'dc+sd-jwt',
      meta: {
        vct_values: ['https://credentials.example.com/identity_credential'],
      },
      claims: [
        { path: ['last_name'] },
        { path: ['first_name'] },
        { path: ['address', 'street_address'] },
        { path: ['org.iso.7367.1', 'vehicle_holder'], values: ['Timo Glastra'] },
      ],
    },
  ],
} satisfies DcqlQuery.Input

class ValueClass {
  constructor(private value: unknown) {}
  toJson() {
    return this.value
  }
}

const mdocWithJT = {
  credential_format: 'mso_mdoc',
  doctype: 'org.iso.7367.1.mVRC',
  namespaces: {
    'org.iso.7367.1': {
      vehicle_holder: 'Martin Auer',
      non_disclosed: 'secret',
    },
    'org.iso.18013.5.1': { first_name: new ValueClass('Martin Auer') },
  },
  cryptographic_holder_binding: true,
} satisfies DcqlMdocCredential

const sdJwtVcWithJT = {
  credential_format: 'dc+sd-jwt',
  vct: 'https://credentials.example.com/identity_credential',
  claims: {
    first_name: 'Arthur',
    last_name: 'Dent',
    // @ts-expect-error ValueClass is not a valid type
    address: {
      street_address: new ValueClass('42 Market Street'),
      locality: 'Milliways',
      postal_code: '12345',
    },
    'org.iso.7367.1': {
      vehicle_holder: 'Timo Glastra',
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

describe('DCQL Query With Json Transform', () => {
  it('mdocMvrc example succeeds', (_t) => {
    const query = DcqlQuery.parse(mdocMvrcQuery)
    DcqlQuery.validate(query)

    const credentials = [mdocWithJT]
    const res = DcqlQuery.query(query, credentials)

    assert(res.can_be_satisfied)
    assert.deepStrictEqual(res.credential_matches, {
      my_credential: {
        success: true,
        credential_query_id: 'my_credential',
        failed_credentials: [],
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
                cryptographic_holder_binding: true,
                credential_format: 'mso_mdoc',
                doctype: 'org.iso.7367.1.mVRC',
              },
            },
            claims: {
              success: true,
              failed_claim_sets: [],
              valid_claim_sets: [
                {
                  claim_set_index: undefined,
                  success: true,
                  output: {
                    'org.iso.7367.1': {
                      vehicle_holder: 'Martin Auer',
                    },
                    'org.iso.18013.5.1': {
                      first_name: new ValueClass('Martin Auer'),
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
                  claim_id: undefined,
                  claim_index: 1,
                  output: {
                    'org.iso.18013.5.1': {
                      first_name: new ValueClass('Martin Auer'),
                    },
                  },
                },
              ],
              failed_claims: [],
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
          },
        ],
      },
      { dcqlQuery: query }
    )

    assert.deepStrictEqual(presentationQueryResult.credential_matches, {
      my_credential: {
        success: true,
        credential_query_id: 'my_credential',
        failed_credentials: [],
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
                cryptographic_holder_binding: true,
                credential_format: 'mso_mdoc',
                doctype: 'org.iso.7367.1.mVRC',
              },
            },
            claims: {
              success: true,
              failed_claim_sets: [],
              valid_claim_sets: [
                {
                  claim_set_index: undefined,
                  success: true,
                  output: {
                    'org.iso.7367.1': {
                      vehicle_holder: 'Martin Auer',
                    },
                    'org.iso.18013.5.1': {
                      first_name: new ValueClass('Martin Auer'),
                    },
                  },
                  valid_claim_indexes: [0, 1],
                },
              ],
              valid_claims: [
                {
                  success: true,
                  claim_index: 0,
                  claim_id: undefined,
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
                      first_name: new ValueClass('Martin Auer'),
                    },
                  },
                },
              ],
              failed_claims: [],
            },
          },
        ],
      },
    })
  })

  it('sdJwtVc example with multiple credentials succeeds', (_t) => {
    const query = DcqlQuery.parse(sdJwtVcExampleQuery)
    DcqlQuery.validate(query)

    // @ts-expect-error ValueClass is not a valid type
    const res = DcqlQuery.query(query, [mdocWithJT, sdJwtVcWithJT])

    assert(res.can_be_satisfied)
    assert.deepStrictEqual(res.credential_matches, {
      my_credential: {
        success: true,
        credential_query_id: 'my_credential',
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
                credential_format: ["Expected credential format to be 'dc+sd-jwt' but received 'mso_mdoc'"],
                vct: [
                  "Expected vct to be 'https://credentials.example.com/identity_credential' but received 'undefined'",
                ],
              },
              output: {
                cryptographic_holder_binding: true,
                credential_format: 'mso_mdoc',
              },
            },
            claims: {
              success: false,
              failed_claim_sets: [
                {
                  claim_set_index: undefined,
                  success: false,
                  issues: {
                    last_name: ["Expected claim 'last_name' to be defined"],
                    first_name: ["Expected claim 'first_name' to be defined"],
                    address: ["Expected claim 'address'.'street_address' to be defined"],
                    'org.iso.7367.1.vehicle_holder': [
                      "Expected claim 'org.iso.7367.1'.'vehicle_holder' to be 'Timo Glastra' but received 'Martin Auer'",
                    ],
                  },
                  failed_claim_indexes: [0, 1, 2, 3],
                  valid_claim_indexes: [],
                },
              ],
              failed_claims: [
                {
                  claim_id: undefined,
                  success: false,
                  issues: {
                    last_name: ["Expected claim 'last_name' to be defined"],
                  },
                  claim_index: 0,
                  output: {},
                },
                {
                  claim_id: undefined,
                  success: false,
                  issues: {
                    first_name: ["Expected claim 'first_name' to be defined"],
                  },
                  claim_index: 1,
                  output: {},
                },
                {
                  claim_id: undefined,
                  success: false,
                  issues: {
                    address: ["Expected claim 'address'.'street_address' to be defined"],
                  },
                  claim_index: 2,
                  output: {},
                },
                {
                  claim_id: undefined,
                  success: false,
                  issues: {
                    'org.iso.7367.1.vehicle_holder': [
                      "Expected claim 'org.iso.7367.1'.'vehicle_holder' to be 'Timo Glastra' but received 'Martin Auer'",
                    ],
                  },
                  claim_index: 3,
                  output: {
                    'org.iso.7367.1': {
                      vehicle_holder: 'Martin Auer',
                    },
                  },
                },
              ],
              valid_claims: [],
            },
          },
        ],
        valid_credentials: [
          {
            success: true,
            input_credential_index: 1,
            trusted_authorities: {
              success: true,
            },
            meta: {
              success: true,
              output: {
                cryptographic_holder_binding: true,
                credential_format: 'dc+sd-jwt',
                vct: 'https://credentials.example.com/identity_credential',
              },
            },
            claims: {
              success: true,
              failed_claim_sets: [],
              valid_claim_sets: [
                {
                  claim_set_index: undefined,
                  success: true,
                  output: {
                    last_name: 'Dent',
                    first_name: 'Arthur',
                    address: {
                      street_address: new ValueClass('42 Market Street'),
                    },
                    'org.iso.7367.1': {
                      vehicle_holder: 'Timo Glastra',
                    },
                  },
                  valid_claim_indexes: [0, 1, 2, 3],
                },
              ],
              valid_claims: [
                {
                  claim_id: undefined,
                  success: true,
                  claim_index: 0,
                  output: {
                    last_name: 'Dent',
                  },
                },
                {
                  claim_id: undefined,
                  success: true,
                  claim_index: 1,
                  output: {
                    first_name: 'Arthur',
                  },
                },
                {
                  claim_id: undefined,
                  success: true,
                  claim_index: 2,
                  output: {
                    address: {
                      street_address: new ValueClass('42 Market Street'),
                    },
                  },
                },
                {
                  claim_id: undefined,
                  success: true,
                  claim_index: 3,
                  output: {
                    'org.iso.7367.1': {
                      vehicle_holder: 'Timo Glastra',
                    },
                  },
                },
              ],
              failed_claims: [],
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

            // @ts-expect-error ValueClass is not an allowed type
            claims: validCredential.claims.valid_claim_sets[0].output,
          },
        ],
      },
      { dcqlQuery: query }
    )

    assert.deepStrictEqual(presentationQueryResult.credential_matches, {
      my_credential: {
        success: true,
        credential_query_id: 'my_credential',
        failed_credentials: [],
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
                cryptographic_holder_binding: true,
                credential_format: 'dc+sd-jwt',
                vct: 'https://credentials.example.com/identity_credential',
              },
            },
            claims: {
              success: true,
              failed_claim_sets: [],
              valid_claim_sets: [
                {
                  success: true,
                  claim_set_index: undefined,
                  output: {
                    last_name: 'Dent',
                    first_name: 'Arthur',
                    address: {
                      street_address: new ValueClass('42 Market Street'),
                    },
                    'org.iso.7367.1': {
                      vehicle_holder: 'Timo Glastra',
                    },
                  },
                  valid_claim_indexes: [0, 1, 2, 3],
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
                      street_address: new ValueClass('42 Market Street'),
                    },
                  },
                },
                {
                  success: true,
                  claim_id: undefined,
                  claim_index: 3,
                  output: {
                    'org.iso.7367.1': {
                      vehicle_holder: 'Timo Glastra',
                    },
                  },
                },
              ],
              failed_claims: [],
            },
          },
        ],
      },
    })
  })
})
