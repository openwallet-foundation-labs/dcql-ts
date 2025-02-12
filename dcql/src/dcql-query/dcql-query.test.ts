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
      meta: { doctype_value: 'org.iso.7367.1.mVRC' },
      claims: [{ path: ['org.iso.7367.1', 'vehicle_holder'] }, { path: ['org.iso.18013.5.1', 'first_name'] }],
    },
  ],
} satisfies DcqlQuery

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
    },
  ],
} satisfies DcqlQuery

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

describe('dcql-query', () => {
  it('mvrc query fails with invalid mdoc', (_t) => {
    const query = DcqlQuery.parse(mdocMvrcQuery)
    DcqlQuery.validate(query)

    const credentials = [exampleMdoc]
    const res = DcqlQuery.query(query, credentials)

    assert(!res.canBeSatisfied)
    assert.deepStrictEqual(res.credential_matches, {
      my_credential: {
        success: false,
        all: [
          [
            {
              typed: false,
              success: false,
              output: {
                credential_format: 'mso_mdoc',
                doctype: 'example_doctype',
                namespaces: {},
              },
              issues: [
                {
                  kind: 'schema',
                  type: 'literal',
                  input: 'example_doctype',
                  expected: '"org.iso.7367.1.mVRC"',
                  received: '"example_doctype"',
                  message: 'Invalid type: Expected "org.iso.7367.1.mVRC" but received "example_doctype"',
                  requirement: undefined,
                  path: [
                    {
                      type: 'object',
                      origin: 'value',
                      input: {
                        credential_format: 'mso_mdoc',
                        doctype: 'example_doctype',
                        namespaces: {
                          example_namespaces: {
                            example_claim: 'example_value',
                          },
                        },
                      },
                      key: 'doctype',
                      value: 'example_doctype',
                    },
                  ],
                  issues: undefined,
                  lang: undefined,
                  abortEarly: undefined,
                  abortPipeEarly: undefined,
                },
                {
                  kind: 'schema',
                  type: 'object',
                  input: undefined,
                  expected: 'Object',
                  received: 'undefined',
                  message: 'Invalid type: Expected Object but received undefined',
                  requirement: undefined,
                  path: [
                    {
                      type: 'object',
                      origin: 'value',
                      input: {
                        credential_format: 'mso_mdoc',
                        doctype: 'example_doctype',
                        namespaces: {
                          example_namespaces: {
                            example_claim: 'example_value',
                          },
                        },
                      },
                      key: 'namespaces',
                      value: {
                        example_namespaces: {
                          example_claim: 'example_value',
                        },
                      },
                    },
                    {
                      type: 'object',
                      origin: 'value',
                      input: {
                        example_namespaces: {
                          example_claim: 'example_value',
                        },
                      },
                      key: 'org.iso.7367.1',
                      value: undefined,
                    },
                  ],
                  issues: undefined,
                  lang: undefined,
                  abortEarly: undefined,
                  abortPipeEarly: undefined,
                },
                {
                  kind: 'schema',
                  type: 'object',
                  input: undefined,
                  expected: 'Object',
                  received: 'undefined',
                  message: 'Invalid type: Expected Object but received undefined',
                  requirement: undefined,
                  path: [
                    {
                      type: 'object',
                      origin: 'value',
                      input: {
                        credential_format: 'mso_mdoc',
                        doctype: 'example_doctype',
                        namespaces: {
                          example_namespaces: {
                            example_claim: 'example_value',
                          },
                        },
                      },
                      key: 'namespaces',
                      value: {
                        example_namespaces: {
                          example_claim: 'example_value',
                        },
                      },
                    },
                    {
                      type: 'object',
                      origin: 'value',
                      input: {
                        example_namespaces: {
                          example_claim: 'example_value',
                        },
                      },
                      key: 'org.iso.18013.5.1',
                      value: undefined,
                    },
                  ],
                  issues: undefined,
                  lang: undefined,
                  abortEarly: undefined,
                  abortPipeEarly: undefined,
                },
              ],
              flattened: {
                nested: {
                  doctype: ['Invalid type: Expected "org.iso.7367.1.mVRC" but received "example_doctype"'],
                  'namespaces.org.iso.7367.1': ['Invalid type: Expected Object but received undefined'],
                  'namespaces.org.iso.18013.5.1': ['Invalid type: Expected Object but received undefined'],
                },
              },
              input_credential_index: 0,
              claim_set_index: undefined,
            },
          ],
        ],
      },
    })
  })

  it('mdocMvrc example with multiple credentials succeeds', (_t) => {
    const query = DcqlQuery.parse(mdocMvrcQuery)
    DcqlQuery.validate(query)

    const res = DcqlQuery.query(query, [exampleMdoc, mdocMvrc])

    assert(res.canBeSatisfied)
    assert.deepStrictEqual(res.credential_matches, {
      my_credential: {
        success: true,
        typed: true,
        input_credential_index: 1,
        claim_set_index: undefined,
        output: {
          credential_format: 'mso_mdoc' as const,
          doctype: 'org.iso.7367.1.mVRC',
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
          namespaces: {
            'org.iso.7367.1': { vehicle_holder: 'Martin Auer' },
            'org.iso.18013.5.1': { first_name: 'Martin Auer' },
          },
        },
      },
    })
  })

  it('mdocMvrc example succeeds', (_t) => {
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
          namespaces: {
            'org.iso.7367.1': { vehicle_holder: 'Martin Auer' },
            'org.iso.18013.5.1': { first_name: 'Martin Auer' },
          },
        },
      },
    })
  })

  it('mdocMvrc example using namespaces succeeds', (_t) => {
    const query = DcqlQuery.parse(mdocNamespaceMvrcQuery)
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
          namespaces: {
            'org.iso.7367.1': { vehicle_holder: 'Martin Auer' },
            'org.iso.18013.5.1': { first_name: 'Martin Auer' },
          },
        },
      },
    })
  })

  it('sdJwtVc example with multiple credentials succeeds', (_t) => {
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
