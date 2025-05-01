import assert from 'node:assert'
import { describe, it } from 'vitest'
import { DcqlPresentationResult } from '../dcql-presentation/m-dcql-presentation-result.js'
import type { DcqlMdocCredential, DcqlSdJwtVcCredential } from '../u-dcql-credential.js'
import { DcqlQuery } from './m-dcql-query.js'

/**
 * The following is a non-normative example of a DCQL query that requests
 * a Verifiable Credential in the format mso_mdoc with the claims vehicle_holder and first_name:
 */
const complexMdocQuery = {
  credentials: [
    {
      id: 'mdl-id',
      format: 'mso_mdoc',
      meta: { doctype_value: 'org.iso.18013.5.1.mDL' },
      claims: [
        {
          id: 'given_name',
          namespace: 'org.iso.18013.5.1',
          claim_name: 'given_name',
        },
        {
          id: 'family_name',
          namespace: 'org.iso.18013.5.1',
          claim_name: 'family_name',
        },
        {
          id: 'portrait',
          namespace: 'org.iso.18013.5.1',
          claim_name: 'portrait',
        },
      ],
    },
    {
      id: 'mdl-address',
      format: 'mso_mdoc',
      meta: { doctype_value: 'org.iso.18013.5.1.mDL' },
      claims: [
        {
          id: 'resident_address',
          path: ['org.iso.18013.5.1', 'resident_address'],
          intent_to_retain: false,
        },
        {
          id: 'resident_country',
          path: ['org.iso.18013.5.1', 'resident_country'],
          intent_to_retain: true,
        },
      ],
    },
    {
      id: 'photo_card-id',
      format: 'mso_mdoc',
      meta: { doctype_value: 'org.iso.23220.photoid.1' },
      claims: [
        {
          id: 'given_name',
          path: ['org.iso.23220.1', 'given_name'],
        },
        {
          id: 'family_name',
          path: ['org.iso.23220.1', 'family_name'],
        },
        {
          id: 'portrait',
          path: ['org.iso.23220.1', 'portrait'],
        },
      ],
    },
    {
      id: 'photo_card-address',
      format: 'mso_mdoc',
      meta: { doctype_value: 'org.iso.23220.photoid.1' },
      claims: [
        {
          id: 'resident_address',
          path: ['org.iso.23220.1', 'resident_address'],
        },
        {
          id: 'resident_country',
          path: ['org.iso.23220.1', 'resident_country'],
        },
      ],
    },
  ],
  credential_sets: [
    { purpose: 'Identification', options: [['mdl-id'], ['photo_card-id']] },
    {
      purpose: 'Proof of address',
      required: false,
      options: [['mdl-address'], ['photo_card-address']],
    },
  ],
} satisfies DcqlQuery.Input

const mdocMdlId = {
  credential_format: 'mso_mdoc',
  doctype: 'org.iso.18013.5.1.mDL',
  namespaces: {
    'org.iso.18013.5.1': {
      given_name: 'Martin',
      family_name: 'Auer',
      portrait: 'https://example.com/portrait',
    },
  },
} satisfies DcqlMdocCredential

const mdocMdlAddress = {
  credential_format: 'mso_mdoc',
  doctype: 'org.iso.18013.5.1.mDL',
  namespaces: {
    'org.iso.18013.5.1': {
      resident_country: 'Italy',
      resident_address: 'Via Roma 1',
      non_disclosed: 'secret',
    },
  },
} satisfies DcqlMdocCredential

const mdocPhotoCardId = {
  credential_format: 'mso_mdoc',
  doctype: 'org.iso.23220.photoid.1',
  namespaces: {
    'org.iso.23220.1': {
      given_name: 'Martin',
      family_name: 'Auer',
      portrait: 'https://example.com/portrait',
    },
  },
} satisfies DcqlMdocCredential

const mdocPhotoCardAddress = {
  credential_format: 'mso_mdoc',
  doctype: 'org.iso.23220.photoid.1',
  namespaces: {
    'org.iso.23220.1': {
      resident_country: 'Italy',
      resident_address: 'Via Roma 1',
      non_disclosed: 'secret',
    },
  },
} satisfies DcqlMdocCredential

const mdocExample = {
  credential_format: 'mso_mdoc',
  doctype: 'example_doctype',
  namespaces: {
    example_namespaces: {
      example_claim: 'example_value',
    },
  },
} satisfies DcqlMdocCredential

const sdJwtVcExample = {
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

describe('complex-mdoc-query', () => {
  it('fails with no credentials', (_t) => {
    const query = DcqlQuery.parse(complexMdocQuery)
    DcqlQuery.validate(query)

    const res = DcqlQuery.query(query, [])
    assert(!res.canBeSatisfied)
  })

  it('fails with credentials that do not satisfy a required claim_set', (_t) => {
    const query = DcqlQuery.parse(complexMdocQuery)
    DcqlQuery.validate(query)

    const res = DcqlQuery.query(query, [mdocMdlAddress, mdocPhotoCardAddress])
    assert(!res.canBeSatisfied)
  })

  it('succeeds if all credentials are present', (_t) => {
    const query = DcqlQuery.parse(complexMdocQuery)
    DcqlQuery.validate(query)

    const res = DcqlQuery.query(query, [
      mdocMdlId,
      mdocMdlAddress,
      mdocPhotoCardId,
      mdocPhotoCardAddress,
      mdocExample,
      sdJwtVcExample,
    ])

    assert.deepStrictEqual(res, {
      canBeSatisfied: true,
      credential_matches: {
        'mdl-address': {
          all: [
            [
              {
                claim_set_index: undefined,
                flattened: {
                  nested: {
                    'namespaces.org.iso.18013.5.1.resident_address': [
                      'Invalid type: Expected (!null & !undefined) but received undefined',
                    ],
                    'namespaces.org.iso.18013.5.1.resident_country': [
                      'Invalid type: Expected (!null & !undefined) but received undefined',
                    ],
                  },
                },
                input_credential_index: 0,
                issues: [
                  {
                    abortEarly: undefined,
                    abortPipeEarly: undefined,
                    expected: '(!null & !undefined)',
                    input: undefined,
                    issues: undefined,
                    kind: 'schema',
                    lang: undefined,
                    message: 'Invalid type: Expected (!null & !undefined) but received undefined',
                    path: [
                      {
                        input: {
                          credential_format: 'mso_mdoc',
                          doctype: 'org.iso.18013.5.1.mDL',
                          namespaces: {
                            'org.iso.18013.5.1': {
                              family_name: 'Auer',
                              given_name: 'Martin',
                              portrait: 'https://example.com/portrait',
                            },
                          },
                        },
                        key: 'namespaces',
                        origin: 'value',
                        type: 'object',
                        value: {
                          'org.iso.18013.5.1': {
                            family_name: 'Auer',
                            given_name: 'Martin',
                            portrait: 'https://example.com/portrait',
                          },
                        },
                      },
                      {
                        input: {
                          'org.iso.18013.5.1': {
                            family_name: 'Auer',
                            given_name: 'Martin',
                            portrait: 'https://example.com/portrait',
                          },
                        },
                        key: 'org.iso.18013.5.1',
                        origin: 'value',
                        type: 'object',
                        value: {
                          family_name: 'Auer',
                          given_name: 'Martin',
                          portrait: 'https://example.com/portrait',
                        },
                      },
                      {
                        input: {
                          family_name: 'Auer',
                          given_name: 'Martin',
                          portrait: 'https://example.com/portrait',
                        },
                        key: 'resident_address',
                        origin: 'value',
                        type: 'object',
                        value: undefined,
                      },
                    ],
                    received: 'undefined',
                    requirement: undefined,
                    type: 'non_nullish',
                  },
                  {
                    abortEarly: undefined,
                    abortPipeEarly: undefined,
                    expected: '(!null & !undefined)',
                    input: undefined,
                    issues: undefined,
                    kind: 'schema',
                    lang: undefined,
                    message: 'Invalid type: Expected (!null & !undefined) but received undefined',
                    path: [
                      {
                        input: {
                          credential_format: 'mso_mdoc',
                          doctype: 'org.iso.18013.5.1.mDL',
                          namespaces: {
                            'org.iso.18013.5.1': {
                              family_name: 'Auer',
                              given_name: 'Martin',
                              portrait: 'https://example.com/portrait',
                            },
                          },
                        },
                        key: 'namespaces',
                        origin: 'value',
                        type: 'object',
                        value: {
                          'org.iso.18013.5.1': {
                            family_name: 'Auer',
                            given_name: 'Martin',
                            portrait: 'https://example.com/portrait',
                          },
                        },
                      },
                      {
                        input: {
                          'org.iso.18013.5.1': {
                            family_name: 'Auer',
                            given_name: 'Martin',
                            portrait: 'https://example.com/portrait',
                          },
                        },
                        key: 'org.iso.18013.5.1',
                        origin: 'value',
                        type: 'object',
                        value: {
                          family_name: 'Auer',
                          given_name: 'Martin',
                          portrait: 'https://example.com/portrait',
                        },
                      },
                      {
                        input: {
                          family_name: 'Auer',
                          given_name: 'Martin',
                          portrait: 'https://example.com/portrait',
                        },
                        key: 'resident_country',
                        origin: 'value',
                        type: 'object',
                        value: undefined,
                      },
                    ],
                    received: 'undefined',
                    requirement: undefined,
                    type: 'non_nullish',
                  },
                ],
                output: {
                  credential_format: 'mso_mdoc',
                  doctype: 'org.iso.18013.5.1.mDL',
                  namespaces: {
                    'org.iso.18013.5.1': {},
                  },
                },
                success: false,
                typed: false,
              },
              {
                claim_set_index: undefined,
                input_credential_index: 1,
                issues: undefined,
                output: {
                  credential_format: 'mso_mdoc',
                  doctype: 'org.iso.18013.5.1.mDL',
                  namespaces: {
                    'org.iso.18013.5.1': {
                      resident_address: 'Via Roma 1',
                      resident_country: 'Italy',
                    },
                  },
                },
                success: true,
                typed: true,
              },
              {
                claim_set_index: undefined,
                flattened: {
                  nested: {
                    doctype: ['Invalid type: Expected "org.iso.18013.5.1.mDL" but received "org.iso.23220.photoid.1"'],
                    'namespaces.org.iso.18013.5.1': ['Invalid type: Expected Object but received undefined'],
                  },
                },
                input_credential_index: 2,
                issues: [
                  {
                    abortEarly: undefined,
                    abortPipeEarly: undefined,
                    expected: '"org.iso.18013.5.1.mDL"',
                    input: 'org.iso.23220.photoid.1',
                    issues: undefined,
                    kind: 'schema',
                    lang: undefined,
                    message: 'Invalid type: Expected "org.iso.18013.5.1.mDL" but received "org.iso.23220.photoid.1"',
                    path: [
                      {
                        input: {
                          credential_format: 'mso_mdoc',
                          doctype: 'org.iso.23220.photoid.1',
                          namespaces: {
                            'org.iso.23220.1': {
                              family_name: 'Auer',
                              given_name: 'Martin',
                              portrait: 'https://example.com/portrait',
                            },
                          },
                        },
                        key: 'doctype',
                        origin: 'value',
                        type: 'object',
                        value: 'org.iso.23220.photoid.1',
                      },
                    ],
                    received: '"org.iso.23220.photoid.1"',
                    requirement: undefined,
                    type: 'literal',
                  },
                  {
                    abortEarly: undefined,
                    abortPipeEarly: undefined,
                    expected: 'Object',
                    input: undefined,
                    issues: undefined,
                    kind: 'schema',
                    lang: undefined,
                    message: 'Invalid type: Expected Object but received undefined',
                    path: [
                      {
                        input: {
                          credential_format: 'mso_mdoc',
                          doctype: 'org.iso.23220.photoid.1',
                          namespaces: {
                            'org.iso.23220.1': {
                              family_name: 'Auer',
                              given_name: 'Martin',
                              portrait: 'https://example.com/portrait',
                            },
                          },
                        },
                        key: 'namespaces',
                        origin: 'value',
                        type: 'object',
                        value: {
                          'org.iso.23220.1': {
                            family_name: 'Auer',
                            given_name: 'Martin',
                            portrait: 'https://example.com/portrait',
                          },
                        },
                      },
                      {
                        input: {
                          'org.iso.23220.1': {
                            family_name: 'Auer',
                            given_name: 'Martin',
                            portrait: 'https://example.com/portrait',
                          },
                        },
                        key: 'org.iso.18013.5.1',
                        origin: 'value',
                        type: 'object',
                        value: undefined,
                      },
                    ],
                    received: 'undefined',
                    requirement: undefined,
                    type: 'object',
                  },
                ],
                output: {
                  credential_format: 'mso_mdoc',
                  doctype: 'org.iso.23220.photoid.1',
                  namespaces: {},
                },
                success: false,
                typed: false,
              },
              {
                claim_set_index: undefined,
                flattened: {
                  nested: {
                    doctype: ['Invalid type: Expected "org.iso.18013.5.1.mDL" but received "org.iso.23220.photoid.1"'],
                    'namespaces.org.iso.18013.5.1': ['Invalid type: Expected Object but received undefined'],
                  },
                },
                input_credential_index: 3,
                issues: [
                  {
                    abortEarly: undefined,
                    abortPipeEarly: undefined,
                    expected: '"org.iso.18013.5.1.mDL"',
                    input: 'org.iso.23220.photoid.1',
                    issues: undefined,
                    kind: 'schema',
                    lang: undefined,
                    message: 'Invalid type: Expected "org.iso.18013.5.1.mDL" but received "org.iso.23220.photoid.1"',
                    path: [
                      {
                        input: {
                          credential_format: 'mso_mdoc',
                          doctype: 'org.iso.23220.photoid.1',
                          namespaces: {
                            'org.iso.23220.1': {
                              non_disclosed: 'secret',
                              resident_address: 'Via Roma 1',
                              resident_country: 'Italy',
                            },
                          },
                        },
                        key: 'doctype',
                        origin: 'value',
                        type: 'object',
                        value: 'org.iso.23220.photoid.1',
                      },
                    ],
                    received: '"org.iso.23220.photoid.1"',
                    requirement: undefined,
                    type: 'literal',
                  },
                  {
                    abortEarly: undefined,
                    abortPipeEarly: undefined,
                    expected: 'Object',
                    input: undefined,
                    issues: undefined,
                    kind: 'schema',
                    lang: undefined,
                    message: 'Invalid type: Expected Object but received undefined',
                    path: [
                      {
                        input: {
                          credential_format: 'mso_mdoc',
                          doctype: 'org.iso.23220.photoid.1',
                          namespaces: {
                            'org.iso.23220.1': {
                              non_disclosed: 'secret',
                              resident_address: 'Via Roma 1',
                              resident_country: 'Italy',
                            },
                          },
                        },
                        key: 'namespaces',
                        origin: 'value',
                        type: 'object',
                        value: {
                          'org.iso.23220.1': {
                            non_disclosed: 'secret',
                            resident_address: 'Via Roma 1',
                            resident_country: 'Italy',
                          },
                        },
                      },
                      {
                        input: {
                          'org.iso.23220.1': {
                            non_disclosed: 'secret',
                            resident_address: 'Via Roma 1',
                            resident_country: 'Italy',
                          },
                        },
                        key: 'org.iso.18013.5.1',
                        origin: 'value',
                        type: 'object',
                        value: undefined,
                      },
                    ],
                    received: 'undefined',
                    requirement: undefined,
                    type: 'object',
                  },
                ],
                output: {
                  credential_format: 'mso_mdoc',
                  doctype: 'org.iso.23220.photoid.1',
                  namespaces: {},
                },
                success: false,
                typed: false,
              },
              {
                claim_set_index: undefined,
                flattened: {
                  nested: {
                    doctype: ['Invalid type: Expected "org.iso.18013.5.1.mDL" but received "example_doctype"'],
                    'namespaces.org.iso.18013.5.1': ['Invalid type: Expected Object but received undefined'],
                  },
                },
                input_credential_index: 4,
                issues: [
                  {
                    abortEarly: undefined,
                    abortPipeEarly: undefined,
                    expected: '"org.iso.18013.5.1.mDL"',
                    input: 'example_doctype',
                    issues: undefined,
                    kind: 'schema',
                    lang: undefined,
                    message: 'Invalid type: Expected "org.iso.18013.5.1.mDL" but received "example_doctype"',
                    path: [
                      {
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
                        origin: 'value',
                        type: 'object',
                        value: 'example_doctype',
                      },
                    ],
                    received: '"example_doctype"',
                    requirement: undefined,
                    type: 'literal',
                  },
                  {
                    abortEarly: undefined,
                    abortPipeEarly: undefined,
                    expected: 'Object',
                    input: undefined,
                    issues: undefined,
                    kind: 'schema',
                    lang: undefined,
                    message: 'Invalid type: Expected Object but received undefined',
                    path: [
                      {
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
                        origin: 'value',
                        type: 'object',
                        value: {
                          example_namespaces: {
                            example_claim: 'example_value',
                          },
                        },
                      },
                      {
                        input: {
                          example_namespaces: {
                            example_claim: 'example_value',
                          },
                        },
                        key: 'org.iso.18013.5.1',
                        origin: 'value',
                        type: 'object',
                        value: undefined,
                      },
                    ],
                    received: 'undefined',
                    requirement: undefined,
                    type: 'object',
                  },
                ],
                output: {
                  credential_format: 'mso_mdoc',
                  doctype: 'example_doctype',
                  namespaces: {},
                },
                success: false,
                typed: false,
              },
              {
                claim_set_index: undefined,
                flattened: {
                  nested: {
                    credential_format: ['Invalid type: Expected "mso_mdoc" but received "vc+sd-jwt"'],
                    doctype: ['Invalid type: Expected "org.iso.18013.5.1.mDL" but received undefined'],
                    namespaces: ['Invalid type: Expected Object but received undefined'],
                  },
                },
                input_credential_index: 5,
                issues: [
                  {
                    abortEarly: undefined,
                    abortPipeEarly: undefined,
                    expected: '"mso_mdoc"',
                    input: 'vc+sd-jwt',
                    issues: undefined,
                    kind: 'schema',
                    lang: undefined,
                    message: 'Invalid type: Expected "mso_mdoc" but received "vc+sd-jwt"',
                    path: [
                      {
                        input: {
                          claims: {
                            address: {
                              locality: 'Milliways',
                              postal_code: '12345',
                              street_address: '42 Market Street',
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
                            first_name: 'Arthur',
                            last_name: 'Dent',
                            nationalities: ['British', 'Betelgeusian'],
                          },
                          credential_format: 'vc+sd-jwt',
                          vct: 'https://credentials.example.com/identity_credential',
                        },
                        key: 'credential_format',
                        origin: 'value',
                        type: 'object',
                        value: 'vc+sd-jwt',
                      },
                    ],
                    received: '"vc+sd-jwt"',
                    requirement: undefined,
                    type: 'literal',
                  },
                  {
                    abortEarly: undefined,
                    abortPipeEarly: undefined,
                    expected: '"org.iso.18013.5.1.mDL"',
                    input: undefined,
                    issues: undefined,
                    kind: 'schema',
                    lang: undefined,
                    message: 'Invalid type: Expected "org.iso.18013.5.1.mDL" but received undefined',
                    path: [
                      {
                        input: {
                          claims: {
                            address: {
                              locality: 'Milliways',
                              postal_code: '12345',
                              street_address: '42 Market Street',
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
                            first_name: 'Arthur',
                            last_name: 'Dent',
                            nationalities: ['British', 'Betelgeusian'],
                          },
                          credential_format: 'vc+sd-jwt',
                          vct: 'https://credentials.example.com/identity_credential',
                        },
                        key: 'doctype',
                        origin: 'value',
                        type: 'object',
                        value: undefined,
                      },
                    ],
                    received: 'undefined',
                    requirement: undefined,
                    type: 'literal',
                  },
                  {
                    abortEarly: undefined,
                    abortPipeEarly: undefined,
                    expected: 'Object',
                    input: undefined,
                    issues: undefined,
                    kind: 'schema',
                    lang: undefined,
                    message: 'Invalid type: Expected Object but received undefined',
                    path: [
                      {
                        input: {
                          claims: {
                            address: {
                              locality: 'Milliways',
                              postal_code: '12345',
                              street_address: '42 Market Street',
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
                            first_name: 'Arthur',
                            last_name: 'Dent',
                            nationalities: ['British', 'Betelgeusian'],
                          },
                          credential_format: 'vc+sd-jwt',
                          vct: 'https://credentials.example.com/identity_credential',
                        },
                        key: 'namespaces',
                        origin: 'value',
                        type: 'object',
                        value: undefined,
                      },
                    ],
                    received: 'undefined',
                    requirement: undefined,
                    type: 'object',
                  },
                ],
                output: {
                  credential_format: 'vc+sd-jwt',
                },
                success: false,
                typed: false,
              },
            ],
          ],
          claim_set_index: undefined,
          input_credential_index: 1,
          output: {
            credential_format: 'mso_mdoc',
            doctype: 'org.iso.18013.5.1.mDL',
            namespaces: {
              'org.iso.18013.5.1': {
                resident_address: 'Via Roma 1',
                resident_country: 'Italy',
              },
            },
          },
          success: true,
          typed: true,
        },
        'mdl-id': {
          all: [
            [
              {
                claim_set_index: undefined,
                input_credential_index: 0,
                issues: undefined,
                output: {
                  credential_format: 'mso_mdoc',
                  doctype: 'org.iso.18013.5.1.mDL',
                  namespaces: {
                    'org.iso.18013.5.1': {
                      family_name: 'Auer',
                      given_name: 'Martin',
                      portrait: 'https://example.com/portrait',
                    },
                  },
                },
                success: true,
                typed: true,
              },
              {
                claim_set_index: undefined,
                flattened: {
                  nested: {
                    'namespaces.org.iso.18013.5.1.family_name': [
                      'Invalid type: Expected (!null & !undefined) but received undefined',
                    ],
                    'namespaces.org.iso.18013.5.1.given_name': [
                      'Invalid type: Expected (!null & !undefined) but received undefined',
                    ],
                    'namespaces.org.iso.18013.5.1.portrait': [
                      'Invalid type: Expected (!null & !undefined) but received undefined',
                    ],
                  },
                },
                input_credential_index: 1,
                issues: [
                  {
                    abortEarly: undefined,
                    abortPipeEarly: undefined,
                    expected: '(!null & !undefined)',
                    input: undefined,
                    issues: undefined,
                    kind: 'schema',
                    lang: undefined,
                    message: 'Invalid type: Expected (!null & !undefined) but received undefined',
                    path: [
                      {
                        input: {
                          credential_format: 'mso_mdoc',
                          doctype: 'org.iso.18013.5.1.mDL',
                          namespaces: {
                            'org.iso.18013.5.1': {
                              non_disclosed: 'secret',
                              resident_address: 'Via Roma 1',
                              resident_country: 'Italy',
                            },
                          },
                        },
                        key: 'namespaces',
                        origin: 'value',
                        type: 'object',
                        value: {
                          'org.iso.18013.5.1': {
                            non_disclosed: 'secret',
                            resident_address: 'Via Roma 1',
                            resident_country: 'Italy',
                          },
                        },
                      },
                      {
                        input: {
                          'org.iso.18013.5.1': {
                            non_disclosed: 'secret',
                            resident_address: 'Via Roma 1',
                            resident_country: 'Italy',
                          },
                        },
                        key: 'org.iso.18013.5.1',
                        origin: 'value',
                        type: 'object',
                        value: {
                          non_disclosed: 'secret',
                          resident_address: 'Via Roma 1',
                          resident_country: 'Italy',
                        },
                      },
                      {
                        input: {
                          non_disclosed: 'secret',
                          resident_address: 'Via Roma 1',
                          resident_country: 'Italy',
                        },
                        key: 'given_name',
                        origin: 'value',
                        type: 'object',
                        value: undefined,
                      },
                    ],
                    received: 'undefined',
                    requirement: undefined,
                    type: 'non_nullish',
                  },
                  {
                    abortEarly: undefined,
                    abortPipeEarly: undefined,
                    expected: '(!null & !undefined)',
                    input: undefined,
                    issues: undefined,
                    kind: 'schema',
                    lang: undefined,
                    message: 'Invalid type: Expected (!null & !undefined) but received undefined',
                    path: [
                      {
                        input: {
                          credential_format: 'mso_mdoc',
                          doctype: 'org.iso.18013.5.1.mDL',
                          namespaces: {
                            'org.iso.18013.5.1': {
                              non_disclosed: 'secret',
                              resident_address: 'Via Roma 1',
                              resident_country: 'Italy',
                            },
                          },
                        },
                        key: 'namespaces',
                        origin: 'value',
                        type: 'object',
                        value: {
                          'org.iso.18013.5.1': {
                            non_disclosed: 'secret',
                            resident_address: 'Via Roma 1',
                            resident_country: 'Italy',
                          },
                        },
                      },
                      {
                        input: {
                          'org.iso.18013.5.1': {
                            non_disclosed: 'secret',
                            resident_address: 'Via Roma 1',
                            resident_country: 'Italy',
                          },
                        },
                        key: 'org.iso.18013.5.1',
                        origin: 'value',
                        type: 'object',
                        value: {
                          non_disclosed: 'secret',
                          resident_address: 'Via Roma 1',
                          resident_country: 'Italy',
                        },
                      },
                      {
                        input: {
                          non_disclosed: 'secret',
                          resident_address: 'Via Roma 1',
                          resident_country: 'Italy',
                        },
                        key: 'family_name',
                        origin: 'value',
                        type: 'object',
                        value: undefined,
                      },
                    ],
                    received: 'undefined',
                    requirement: undefined,
                    type: 'non_nullish',
                  },
                  {
                    abortEarly: undefined,
                    abortPipeEarly: undefined,
                    expected: '(!null & !undefined)',
                    input: undefined,
                    issues: undefined,
                    kind: 'schema',
                    lang: undefined,
                    message: 'Invalid type: Expected (!null & !undefined) but received undefined',
                    path: [
                      {
                        input: {
                          credential_format: 'mso_mdoc',
                          doctype: 'org.iso.18013.5.1.mDL',
                          namespaces: {
                            'org.iso.18013.5.1': {
                              non_disclosed: 'secret',
                              resident_address: 'Via Roma 1',
                              resident_country: 'Italy',
                            },
                          },
                        },
                        key: 'namespaces',
                        origin: 'value',
                        type: 'object',
                        value: {
                          'org.iso.18013.5.1': {
                            non_disclosed: 'secret',
                            resident_address: 'Via Roma 1',
                            resident_country: 'Italy',
                          },
                        },
                      },
                      {
                        input: {
                          'org.iso.18013.5.1': {
                            non_disclosed: 'secret',
                            resident_address: 'Via Roma 1',
                            resident_country: 'Italy',
                          },
                        },
                        key: 'org.iso.18013.5.1',
                        origin: 'value',
                        type: 'object',
                        value: {
                          non_disclosed: 'secret',
                          resident_address: 'Via Roma 1',
                          resident_country: 'Italy',
                        },
                      },
                      {
                        input: {
                          non_disclosed: 'secret',
                          resident_address: 'Via Roma 1',
                          resident_country: 'Italy',
                        },
                        key: 'portrait',
                        origin: 'value',
                        type: 'object',
                        value: undefined,
                      },
                    ],
                    received: 'undefined',
                    requirement: undefined,
                    type: 'non_nullish',
                  },
                ],
                output: {
                  credential_format: 'mso_mdoc',
                  doctype: 'org.iso.18013.5.1.mDL',
                  namespaces: {
                    'org.iso.18013.5.1': {},
                  },
                },
                success: false,
                typed: false,
              },
              {
                claim_set_index: undefined,
                flattened: {
                  nested: {
                    doctype: ['Invalid type: Expected "org.iso.18013.5.1.mDL" but received "org.iso.23220.photoid.1"'],
                    'namespaces.org.iso.18013.5.1': ['Invalid type: Expected Object but received undefined'],
                  },
                },
                input_credential_index: 2,
                issues: [
                  {
                    abortEarly: undefined,
                    abortPipeEarly: undefined,
                    expected: '"org.iso.18013.5.1.mDL"',
                    input: 'org.iso.23220.photoid.1',
                    issues: undefined,
                    kind: 'schema',
                    lang: undefined,
                    message: 'Invalid type: Expected "org.iso.18013.5.1.mDL" but received "org.iso.23220.photoid.1"',
                    path: [
                      {
                        input: {
                          credential_format: 'mso_mdoc',
                          doctype: 'org.iso.23220.photoid.1',
                          namespaces: {
                            'org.iso.23220.1': {
                              family_name: 'Auer',
                              given_name: 'Martin',
                              portrait: 'https://example.com/portrait',
                            },
                          },
                        },
                        key: 'doctype',
                        origin: 'value',
                        type: 'object',
                        value: 'org.iso.23220.photoid.1',
                      },
                    ],
                    received: '"org.iso.23220.photoid.1"',
                    requirement: undefined,
                    type: 'literal',
                  },
                  {
                    abortEarly: undefined,
                    abortPipeEarly: undefined,
                    expected: 'Object',
                    input: undefined,
                    issues: undefined,
                    kind: 'schema',
                    lang: undefined,
                    message: 'Invalid type: Expected Object but received undefined',
                    path: [
                      {
                        input: {
                          credential_format: 'mso_mdoc',
                          doctype: 'org.iso.23220.photoid.1',
                          namespaces: {
                            'org.iso.23220.1': {
                              family_name: 'Auer',
                              given_name: 'Martin',
                              portrait: 'https://example.com/portrait',
                            },
                          },
                        },
                        key: 'namespaces',
                        origin: 'value',
                        type: 'object',
                        value: {
                          'org.iso.23220.1': {
                            family_name: 'Auer',
                            given_name: 'Martin',
                            portrait: 'https://example.com/portrait',
                          },
                        },
                      },
                      {
                        input: {
                          'org.iso.23220.1': {
                            family_name: 'Auer',
                            given_name: 'Martin',
                            portrait: 'https://example.com/portrait',
                          },
                        },
                        key: 'org.iso.18013.5.1',
                        origin: 'value',
                        type: 'object',
                        value: undefined,
                      },
                    ],
                    received: 'undefined',
                    requirement: undefined,
                    type: 'object',
                  },
                ],
                output: {
                  credential_format: 'mso_mdoc',
                  doctype: 'org.iso.23220.photoid.1',
                  namespaces: {},
                },
                success: false,
                typed: false,
              },
              {
                claim_set_index: undefined,
                flattened: {
                  nested: {
                    doctype: ['Invalid type: Expected "org.iso.18013.5.1.mDL" but received "org.iso.23220.photoid.1"'],
                    'namespaces.org.iso.18013.5.1': ['Invalid type: Expected Object but received undefined'],
                  },
                },
                input_credential_index: 3,
                issues: [
                  {
                    abortEarly: undefined,
                    abortPipeEarly: undefined,
                    expected: '"org.iso.18013.5.1.mDL"',
                    input: 'org.iso.23220.photoid.1',
                    issues: undefined,
                    kind: 'schema',
                    lang: undefined,
                    message: 'Invalid type: Expected "org.iso.18013.5.1.mDL" but received "org.iso.23220.photoid.1"',
                    path: [
                      {
                        input: {
                          credential_format: 'mso_mdoc',
                          doctype: 'org.iso.23220.photoid.1',
                          namespaces: {
                            'org.iso.23220.1': {
                              non_disclosed: 'secret',
                              resident_address: 'Via Roma 1',
                              resident_country: 'Italy',
                            },
                          },
                        },
                        key: 'doctype',
                        origin: 'value',
                        type: 'object',
                        value: 'org.iso.23220.photoid.1',
                      },
                    ],
                    received: '"org.iso.23220.photoid.1"',
                    requirement: undefined,
                    type: 'literal',
                  },
                  {
                    abortEarly: undefined,
                    abortPipeEarly: undefined,
                    expected: 'Object',
                    input: undefined,
                    issues: undefined,
                    kind: 'schema',
                    lang: undefined,
                    message: 'Invalid type: Expected Object but received undefined',
                    path: [
                      {
                        input: {
                          credential_format: 'mso_mdoc',
                          doctype: 'org.iso.23220.photoid.1',
                          namespaces: {
                            'org.iso.23220.1': {
                              non_disclosed: 'secret',
                              resident_address: 'Via Roma 1',
                              resident_country: 'Italy',
                            },
                          },
                        },
                        key: 'namespaces',
                        origin: 'value',
                        type: 'object',
                        value: {
                          'org.iso.23220.1': {
                            non_disclosed: 'secret',
                            resident_address: 'Via Roma 1',
                            resident_country: 'Italy',
                          },
                        },
                      },
                      {
                        input: {
                          'org.iso.23220.1': {
                            non_disclosed: 'secret',
                            resident_address: 'Via Roma 1',
                            resident_country: 'Italy',
                          },
                        },
                        key: 'org.iso.18013.5.1',
                        origin: 'value',
                        type: 'object',
                        value: undefined,
                      },
                    ],
                    received: 'undefined',
                    requirement: undefined,
                    type: 'object',
                  },
                ],
                output: {
                  credential_format: 'mso_mdoc',
                  doctype: 'org.iso.23220.photoid.1',
                  namespaces: {},
                },
                success: false,
                typed: false,
              },
              {
                claim_set_index: undefined,
                flattened: {
                  nested: {
                    doctype: ['Invalid type: Expected "org.iso.18013.5.1.mDL" but received "example_doctype"'],
                    'namespaces.org.iso.18013.5.1': ['Invalid type: Expected Object but received undefined'],
                  },
                },
                input_credential_index: 4,
                issues: [
                  {
                    abortEarly: undefined,
                    abortPipeEarly: undefined,
                    expected: '"org.iso.18013.5.1.mDL"',
                    input: 'example_doctype',
                    issues: undefined,
                    kind: 'schema',
                    lang: undefined,
                    message: 'Invalid type: Expected "org.iso.18013.5.1.mDL" but received "example_doctype"',
                    path: [
                      {
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
                        origin: 'value',
                        type: 'object',
                        value: 'example_doctype',
                      },
                    ],
                    received: '"example_doctype"',
                    requirement: undefined,
                    type: 'literal',
                  },
                  {
                    abortEarly: undefined,
                    abortPipeEarly: undefined,
                    expected: 'Object',
                    input: undefined,
                    issues: undefined,
                    kind: 'schema',
                    lang: undefined,
                    message: 'Invalid type: Expected Object but received undefined',
                    path: [
                      {
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
                        origin: 'value',
                        type: 'object',
                        value: {
                          example_namespaces: {
                            example_claim: 'example_value',
                          },
                        },
                      },
                      {
                        input: {
                          example_namespaces: {
                            example_claim: 'example_value',
                          },
                        },
                        key: 'org.iso.18013.5.1',
                        origin: 'value',
                        type: 'object',
                        value: undefined,
                      },
                    ],
                    received: 'undefined',
                    requirement: undefined,
                    type: 'object',
                  },
                ],
                output: {
                  credential_format: 'mso_mdoc',
                  doctype: 'example_doctype',
                  namespaces: {},
                },
                success: false,
                typed: false,
              },
              {
                claim_set_index: undefined,
                flattened: {
                  nested: {
                    credential_format: ['Invalid type: Expected "mso_mdoc" but received "vc+sd-jwt"'],
                    doctype: ['Invalid type: Expected "org.iso.18013.5.1.mDL" but received undefined'],
                    namespaces: ['Invalid type: Expected Object but received undefined'],
                  },
                },
                input_credential_index: 5,
                issues: [
                  {
                    abortEarly: undefined,
                    abortPipeEarly: undefined,
                    expected: '"mso_mdoc"',
                    input: 'vc+sd-jwt',
                    issues: undefined,
                    kind: 'schema',
                    lang: undefined,
                    message: 'Invalid type: Expected "mso_mdoc" but received "vc+sd-jwt"',
                    path: [
                      {
                        input: {
                          claims: {
                            address: {
                              locality: 'Milliways',
                              postal_code: '12345',
                              street_address: '42 Market Street',
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
                            first_name: 'Arthur',
                            last_name: 'Dent',
                            nationalities: ['British', 'Betelgeusian'],
                          },
                          credential_format: 'vc+sd-jwt',
                          vct: 'https://credentials.example.com/identity_credential',
                        },
                        key: 'credential_format',
                        origin: 'value',
                        type: 'object',
                        value: 'vc+sd-jwt',
                      },
                    ],
                    received: '"vc+sd-jwt"',
                    requirement: undefined,
                    type: 'literal',
                  },
                  {
                    abortEarly: undefined,
                    abortPipeEarly: undefined,
                    expected: '"org.iso.18013.5.1.mDL"',
                    input: undefined,
                    issues: undefined,
                    kind: 'schema',
                    lang: undefined,
                    message: 'Invalid type: Expected "org.iso.18013.5.1.mDL" but received undefined',
                    path: [
                      {
                        input: {
                          claims: {
                            address: {
                              locality: 'Milliways',
                              postal_code: '12345',
                              street_address: '42 Market Street',
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
                            first_name: 'Arthur',
                            last_name: 'Dent',
                            nationalities: ['British', 'Betelgeusian'],
                          },
                          credential_format: 'vc+sd-jwt',
                          vct: 'https://credentials.example.com/identity_credential',
                        },
                        key: 'doctype',
                        origin: 'value',
                        type: 'object',
                        value: undefined,
                      },
                    ],
                    received: 'undefined',
                    requirement: undefined,
                    type: 'literal',
                  },
                  {
                    abortEarly: undefined,
                    abortPipeEarly: undefined,
                    expected: 'Object',
                    input: undefined,
                    issues: undefined,
                    kind: 'schema',
                    lang: undefined,
                    message: 'Invalid type: Expected Object but received undefined',
                    path: [
                      {
                        input: {
                          claims: {
                            address: {
                              locality: 'Milliways',
                              postal_code: '12345',
                              street_address: '42 Market Street',
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
                            first_name: 'Arthur',
                            last_name: 'Dent',
                            nationalities: ['British', 'Betelgeusian'],
                          },
                          credential_format: 'vc+sd-jwt',
                          vct: 'https://credentials.example.com/identity_credential',
                        },
                        key: 'namespaces',
                        origin: 'value',
                        type: 'object',
                        value: undefined,
                      },
                    ],
                    received: 'undefined',
                    requirement: undefined,
                    type: 'object',
                  },
                ],
                output: {
                  credential_format: 'vc+sd-jwt',
                },
                success: false,
                typed: false,
              },
            ],
          ],
          claim_set_index: undefined,
          input_credential_index: 0,
          output: {
            credential_format: 'mso_mdoc',
            doctype: 'org.iso.18013.5.1.mDL',
            namespaces: {
              'org.iso.18013.5.1': {
                family_name: 'Auer',
                given_name: 'Martin',
                portrait: 'https://example.com/portrait',
              },
            },
          },
          success: true,
          typed: true,
        },
        'photo_card-address': {
          all: [
            [
              {
                claim_set_index: undefined,
                flattened: {
                  nested: {
                    doctype: ['Invalid type: Expected "org.iso.23220.photoid.1" but received "org.iso.18013.5.1.mDL"'],
                    'namespaces.org.iso.23220.1': ['Invalid type: Expected Object but received undefined'],
                  },
                },
                input_credential_index: 0,
                issues: [
                  {
                    abortEarly: undefined,
                    abortPipeEarly: undefined,
                    expected: '"org.iso.23220.photoid.1"',
                    input: 'org.iso.18013.5.1.mDL',
                    issues: undefined,
                    kind: 'schema',
                    lang: undefined,
                    message: 'Invalid type: Expected "org.iso.23220.photoid.1" but received "org.iso.18013.5.1.mDL"',
                    path: [
                      {
                        input: {
                          credential_format: 'mso_mdoc',
                          doctype: 'org.iso.18013.5.1.mDL',
                          namespaces: {
                            'org.iso.18013.5.1': {
                              family_name: 'Auer',
                              given_name: 'Martin',
                              portrait: 'https://example.com/portrait',
                            },
                          },
                        },
                        key: 'doctype',
                        origin: 'value',
                        type: 'object',
                        value: 'org.iso.18013.5.1.mDL',
                      },
                    ],
                    received: '"org.iso.18013.5.1.mDL"',
                    requirement: undefined,
                    type: 'literal',
                  },
                  {
                    abortEarly: undefined,
                    abortPipeEarly: undefined,
                    expected: 'Object',
                    input: undefined,
                    issues: undefined,
                    kind: 'schema',
                    lang: undefined,
                    message: 'Invalid type: Expected Object but received undefined',
                    path: [
                      {
                        input: {
                          credential_format: 'mso_mdoc',
                          doctype: 'org.iso.18013.5.1.mDL',
                          namespaces: {
                            'org.iso.18013.5.1': {
                              family_name: 'Auer',
                              given_name: 'Martin',
                              portrait: 'https://example.com/portrait',
                            },
                          },
                        },
                        key: 'namespaces',
                        origin: 'value',
                        type: 'object',
                        value: {
                          'org.iso.18013.5.1': {
                            family_name: 'Auer',
                            given_name: 'Martin',
                            portrait: 'https://example.com/portrait',
                          },
                        },
                      },
                      {
                        input: {
                          'org.iso.18013.5.1': {
                            family_name: 'Auer',
                            given_name: 'Martin',
                            portrait: 'https://example.com/portrait',
                          },
                        },
                        key: 'org.iso.23220.1',
                        origin: 'value',
                        type: 'object',
                        value: undefined,
                      },
                    ],
                    received: 'undefined',
                    requirement: undefined,
                    type: 'object',
                  },
                ],
                output: {
                  credential_format: 'mso_mdoc',
                  doctype: 'org.iso.18013.5.1.mDL',
                  namespaces: {},
                },
                success: false,
                typed: false,
              },
              {
                claim_set_index: undefined,
                flattened: {
                  nested: {
                    doctype: ['Invalid type: Expected "org.iso.23220.photoid.1" but received "org.iso.18013.5.1.mDL"'],
                    'namespaces.org.iso.23220.1': ['Invalid type: Expected Object but received undefined'],
                  },
                },
                input_credential_index: 1,
                issues: [
                  {
                    abortEarly: undefined,
                    abortPipeEarly: undefined,
                    expected: '"org.iso.23220.photoid.1"',
                    input: 'org.iso.18013.5.1.mDL',
                    issues: undefined,
                    kind: 'schema',
                    lang: undefined,
                    message: 'Invalid type: Expected "org.iso.23220.photoid.1" but received "org.iso.18013.5.1.mDL"',
                    path: [
                      {
                        input: {
                          credential_format: 'mso_mdoc',
                          doctype: 'org.iso.18013.5.1.mDL',
                          namespaces: {
                            'org.iso.18013.5.1': {
                              non_disclosed: 'secret',
                              resident_address: 'Via Roma 1',
                              resident_country: 'Italy',
                            },
                          },
                        },
                        key: 'doctype',
                        origin: 'value',
                        type: 'object',
                        value: 'org.iso.18013.5.1.mDL',
                      },
                    ],
                    received: '"org.iso.18013.5.1.mDL"',
                    requirement: undefined,
                    type: 'literal',
                  },
                  {
                    abortEarly: undefined,
                    abortPipeEarly: undefined,
                    expected: 'Object',
                    input: undefined,
                    issues: undefined,
                    kind: 'schema',
                    lang: undefined,
                    message: 'Invalid type: Expected Object but received undefined',
                    path: [
                      {
                        input: {
                          credential_format: 'mso_mdoc',
                          doctype: 'org.iso.18013.5.1.mDL',
                          namespaces: {
                            'org.iso.18013.5.1': {
                              non_disclosed: 'secret',
                              resident_address: 'Via Roma 1',
                              resident_country: 'Italy',
                            },
                          },
                        },
                        key: 'namespaces',
                        origin: 'value',
                        type: 'object',
                        value: {
                          'org.iso.18013.5.1': {
                            non_disclosed: 'secret',
                            resident_address: 'Via Roma 1',
                            resident_country: 'Italy',
                          },
                        },
                      },
                      {
                        input: {
                          'org.iso.18013.5.1': {
                            non_disclosed: 'secret',
                            resident_address: 'Via Roma 1',
                            resident_country: 'Italy',
                          },
                        },
                        key: 'org.iso.23220.1',
                        origin: 'value',
                        type: 'object',
                        value: undefined,
                      },
                    ],
                    received: 'undefined',
                    requirement: undefined,
                    type: 'object',
                  },
                ],
                output: {
                  credential_format: 'mso_mdoc',
                  doctype: 'org.iso.18013.5.1.mDL',
                  namespaces: {},
                },
                success: false,
                typed: false,
              },
              {
                claim_set_index: undefined,
                flattened: {
                  nested: {
                    'namespaces.org.iso.23220.1.resident_address': [
                      'Invalid type: Expected (!null & !undefined) but received undefined',
                    ],
                    'namespaces.org.iso.23220.1.resident_country': [
                      'Invalid type: Expected (!null & !undefined) but received undefined',
                    ],
                  },
                },
                input_credential_index: 2,
                issues: [
                  {
                    abortEarly: undefined,
                    abortPipeEarly: undefined,
                    expected: '(!null & !undefined)',
                    input: undefined,
                    issues: undefined,
                    kind: 'schema',
                    lang: undefined,
                    message: 'Invalid type: Expected (!null & !undefined) but received undefined',
                    path: [
                      {
                        input: {
                          credential_format: 'mso_mdoc',
                          doctype: 'org.iso.23220.photoid.1',
                          namespaces: {
                            'org.iso.23220.1': {
                              family_name: 'Auer',
                              given_name: 'Martin',
                              portrait: 'https://example.com/portrait',
                            },
                          },
                        },
                        key: 'namespaces',
                        origin: 'value',
                        type: 'object',
                        value: {
                          'org.iso.23220.1': {
                            family_name: 'Auer',
                            given_name: 'Martin',
                            portrait: 'https://example.com/portrait',
                          },
                        },
                      },
                      {
                        input: {
                          'org.iso.23220.1': {
                            family_name: 'Auer',
                            given_name: 'Martin',
                            portrait: 'https://example.com/portrait',
                          },
                        },
                        key: 'org.iso.23220.1',
                        origin: 'value',
                        type: 'object',
                        value: {
                          family_name: 'Auer',
                          given_name: 'Martin',
                          portrait: 'https://example.com/portrait',
                        },
                      },
                      {
                        input: {
                          family_name: 'Auer',
                          given_name: 'Martin',
                          portrait: 'https://example.com/portrait',
                        },
                        key: 'resident_address',
                        origin: 'value',
                        type: 'object',
                        value: undefined,
                      },
                    ],
                    received: 'undefined',
                    requirement: undefined,
                    type: 'non_nullish',
                  },
                  {
                    abortEarly: undefined,
                    abortPipeEarly: undefined,
                    expected: '(!null & !undefined)',
                    input: undefined,
                    issues: undefined,
                    kind: 'schema',
                    lang: undefined,
                    message: 'Invalid type: Expected (!null & !undefined) but received undefined',
                    path: [
                      {
                        input: {
                          credential_format: 'mso_mdoc',
                          doctype: 'org.iso.23220.photoid.1',
                          namespaces: {
                            'org.iso.23220.1': {
                              family_name: 'Auer',
                              given_name: 'Martin',
                              portrait: 'https://example.com/portrait',
                            },
                          },
                        },
                        key: 'namespaces',
                        origin: 'value',
                        type: 'object',
                        value: {
                          'org.iso.23220.1': {
                            family_name: 'Auer',
                            given_name: 'Martin',
                            portrait: 'https://example.com/portrait',
                          },
                        },
                      },
                      {
                        input: {
                          'org.iso.23220.1': {
                            family_name: 'Auer',
                            given_name: 'Martin',
                            portrait: 'https://example.com/portrait',
                          },
                        },
                        key: 'org.iso.23220.1',
                        origin: 'value',
                        type: 'object',
                        value: {
                          family_name: 'Auer',
                          given_name: 'Martin',
                          portrait: 'https://example.com/portrait',
                        },
                      },
                      {
                        input: {
                          family_name: 'Auer',
                          given_name: 'Martin',
                          portrait: 'https://example.com/portrait',
                        },
                        key: 'resident_country',
                        origin: 'value',
                        type: 'object',
                        value: undefined,
                      },
                    ],
                    received: 'undefined',
                    requirement: undefined,
                    type: 'non_nullish',
                  },
                ],
                output: {
                  credential_format: 'mso_mdoc',
                  doctype: 'org.iso.23220.photoid.1',
                  namespaces: {
                    'org.iso.23220.1': {},
                  },
                },
                success: false,
                typed: false,
              },
              {
                claim_set_index: undefined,
                input_credential_index: 3,
                issues: undefined,
                output: {
                  credential_format: 'mso_mdoc',
                  doctype: 'org.iso.23220.photoid.1',
                  namespaces: {
                    'org.iso.23220.1': {
                      resident_address: 'Via Roma 1',
                      resident_country: 'Italy',
                    },
                  },
                },
                success: true,
                typed: true,
              },
              {
                claim_set_index: undefined,
                flattened: {
                  nested: {
                    doctype: ['Invalid type: Expected "org.iso.23220.photoid.1" but received "example_doctype"'],
                    'namespaces.org.iso.23220.1': ['Invalid type: Expected Object but received undefined'],
                  },
                },
                input_credential_index: 4,
                issues: [
                  {
                    abortEarly: undefined,
                    abortPipeEarly: undefined,
                    expected: '"org.iso.23220.photoid.1"',
                    input: 'example_doctype',
                    issues: undefined,
                    kind: 'schema',
                    lang: undefined,
                    message: 'Invalid type: Expected "org.iso.23220.photoid.1" but received "example_doctype"',
                    path: [
                      {
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
                        origin: 'value',
                        type: 'object',
                        value: 'example_doctype',
                      },
                    ],
                    received: '"example_doctype"',
                    requirement: undefined,
                    type: 'literal',
                  },
                  {
                    abortEarly: undefined,
                    abortPipeEarly: undefined,
                    expected: 'Object',
                    input: undefined,
                    issues: undefined,
                    kind: 'schema',
                    lang: undefined,
                    message: 'Invalid type: Expected Object but received undefined',
                    path: [
                      {
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
                        origin: 'value',
                        type: 'object',
                        value: {
                          example_namespaces: {
                            example_claim: 'example_value',
                          },
                        },
                      },
                      {
                        input: {
                          example_namespaces: {
                            example_claim: 'example_value',
                          },
                        },
                        key: 'org.iso.23220.1',
                        origin: 'value',
                        type: 'object',
                        value: undefined,
                      },
                    ],
                    received: 'undefined',
                    requirement: undefined,
                    type: 'object',
                  },
                ],
                output: {
                  credential_format: 'mso_mdoc',
                  doctype: 'example_doctype',
                  namespaces: {},
                },
                success: false,
                typed: false,
              },
              {
                claim_set_index: undefined,
                flattened: {
                  nested: {
                    credential_format: ['Invalid type: Expected "mso_mdoc" but received "vc+sd-jwt"'],
                    doctype: ['Invalid type: Expected "org.iso.23220.photoid.1" but received undefined'],
                    namespaces: ['Invalid type: Expected Object but received undefined'],
                  },
                },
                input_credential_index: 5,
                issues: [
                  {
                    abortEarly: undefined,
                    abortPipeEarly: undefined,
                    expected: '"mso_mdoc"',
                    input: 'vc+sd-jwt',
                    issues: undefined,
                    kind: 'schema',
                    lang: undefined,
                    message: 'Invalid type: Expected "mso_mdoc" but received "vc+sd-jwt"',
                    path: [
                      {
                        input: {
                          claims: {
                            address: {
                              locality: 'Milliways',
                              postal_code: '12345',
                              street_address: '42 Market Street',
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
                            first_name: 'Arthur',
                            last_name: 'Dent',
                            nationalities: ['British', 'Betelgeusian'],
                          },
                          credential_format: 'vc+sd-jwt',
                          vct: 'https://credentials.example.com/identity_credential',
                        },
                        key: 'credential_format',
                        origin: 'value',
                        type: 'object',
                        value: 'vc+sd-jwt',
                      },
                    ],
                    received: '"vc+sd-jwt"',
                    requirement: undefined,
                    type: 'literal',
                  },
                  {
                    abortEarly: undefined,
                    abortPipeEarly: undefined,
                    expected: '"org.iso.23220.photoid.1"',
                    input: undefined,
                    issues: undefined,
                    kind: 'schema',
                    lang: undefined,
                    message: 'Invalid type: Expected "org.iso.23220.photoid.1" but received undefined',
                    path: [
                      {
                        input: {
                          claims: {
                            address: {
                              locality: 'Milliways',
                              postal_code: '12345',
                              street_address: '42 Market Street',
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
                            first_name: 'Arthur',
                            last_name: 'Dent',
                            nationalities: ['British', 'Betelgeusian'],
                          },
                          credential_format: 'vc+sd-jwt',
                          vct: 'https://credentials.example.com/identity_credential',
                        },
                        key: 'doctype',
                        origin: 'value',
                        type: 'object',
                        value: undefined,
                      },
                    ],
                    received: 'undefined',
                    requirement: undefined,
                    type: 'literal',
                  },
                  {
                    abortEarly: undefined,
                    abortPipeEarly: undefined,
                    expected: 'Object',
                    input: undefined,
                    issues: undefined,
                    kind: 'schema',
                    lang: undefined,
                    message: 'Invalid type: Expected Object but received undefined',
                    path: [
                      {
                        input: {
                          claims: {
                            address: {
                              locality: 'Milliways',
                              postal_code: '12345',
                              street_address: '42 Market Street',
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
                            first_name: 'Arthur',
                            last_name: 'Dent',
                            nationalities: ['British', 'Betelgeusian'],
                          },
                          credential_format: 'vc+sd-jwt',
                          vct: 'https://credentials.example.com/identity_credential',
                        },
                        key: 'namespaces',
                        origin: 'value',
                        type: 'object',
                        value: undefined,
                      },
                    ],
                    received: 'undefined',
                    requirement: undefined,
                    type: 'object',
                  },
                ],
                output: {
                  credential_format: 'vc+sd-jwt',
                },
                success: false,
                typed: false,
              },
            ],
          ],
          claim_set_index: undefined,
          input_credential_index: 3,
          output: {
            credential_format: 'mso_mdoc',
            doctype: 'org.iso.23220.photoid.1',
            namespaces: {
              'org.iso.23220.1': {
                resident_address: 'Via Roma 1',
                resident_country: 'Italy',
              },
            },
          },
          success: true,
          typed: true,
        },
        'photo_card-id': {
          all: [
            [
              {
                claim_set_index: undefined,
                flattened: {
                  nested: {
                    doctype: ['Invalid type: Expected "org.iso.23220.photoid.1" but received "org.iso.18013.5.1.mDL"'],
                    'namespaces.org.iso.23220.1': ['Invalid type: Expected Object but received undefined'],
                  },
                },
                input_credential_index: 0,
                issues: [
                  {
                    abortEarly: undefined,
                    abortPipeEarly: undefined,
                    expected: '"org.iso.23220.photoid.1"',
                    input: 'org.iso.18013.5.1.mDL',
                    issues: undefined,
                    kind: 'schema',
                    lang: undefined,
                    message: 'Invalid type: Expected "org.iso.23220.photoid.1" but received "org.iso.18013.5.1.mDL"',
                    path: [
                      {
                        input: {
                          credential_format: 'mso_mdoc',
                          doctype: 'org.iso.18013.5.1.mDL',
                          namespaces: {
                            'org.iso.18013.5.1': {
                              family_name: 'Auer',
                              given_name: 'Martin',
                              portrait: 'https://example.com/portrait',
                            },
                          },
                        },
                        key: 'doctype',
                        origin: 'value',
                        type: 'object',
                        value: 'org.iso.18013.5.1.mDL',
                      },
                    ],
                    received: '"org.iso.18013.5.1.mDL"',
                    requirement: undefined,
                    type: 'literal',
                  },
                  {
                    abortEarly: undefined,
                    abortPipeEarly: undefined,
                    expected: 'Object',
                    input: undefined,
                    issues: undefined,
                    kind: 'schema',
                    lang: undefined,
                    message: 'Invalid type: Expected Object but received undefined',
                    path: [
                      {
                        input: {
                          credential_format: 'mso_mdoc',
                          doctype: 'org.iso.18013.5.1.mDL',
                          namespaces: {
                            'org.iso.18013.5.1': {
                              family_name: 'Auer',
                              given_name: 'Martin',
                              portrait: 'https://example.com/portrait',
                            },
                          },
                        },
                        key: 'namespaces',
                        origin: 'value',
                        type: 'object',
                        value: {
                          'org.iso.18013.5.1': {
                            family_name: 'Auer',
                            given_name: 'Martin',
                            portrait: 'https://example.com/portrait',
                          },
                        },
                      },
                      {
                        input: {
                          'org.iso.18013.5.1': {
                            family_name: 'Auer',
                            given_name: 'Martin',
                            portrait: 'https://example.com/portrait',
                          },
                        },
                        key: 'org.iso.23220.1',
                        origin: 'value',
                        type: 'object',
                        value: undefined,
                      },
                    ],
                    received: 'undefined',
                    requirement: undefined,
                    type: 'object',
                  },
                ],
                output: {
                  credential_format: 'mso_mdoc',
                  doctype: 'org.iso.18013.5.1.mDL',
                  namespaces: {},
                },
                success: false,
                typed: false,
              },
              {
                claim_set_index: undefined,
                flattened: {
                  nested: {
                    doctype: ['Invalid type: Expected "org.iso.23220.photoid.1" but received "org.iso.18013.5.1.mDL"'],
                    'namespaces.org.iso.23220.1': ['Invalid type: Expected Object but received undefined'],
                  },
                },
                input_credential_index: 1,
                issues: [
                  {
                    abortEarly: undefined,
                    abortPipeEarly: undefined,
                    expected: '"org.iso.23220.photoid.1"',
                    input: 'org.iso.18013.5.1.mDL',
                    issues: undefined,
                    kind: 'schema',
                    lang: undefined,
                    message: 'Invalid type: Expected "org.iso.23220.photoid.1" but received "org.iso.18013.5.1.mDL"',
                    path: [
                      {
                        input: {
                          credential_format: 'mso_mdoc',
                          doctype: 'org.iso.18013.5.1.mDL',
                          namespaces: {
                            'org.iso.18013.5.1': {
                              non_disclosed: 'secret',
                              resident_address: 'Via Roma 1',
                              resident_country: 'Italy',
                            },
                          },
                        },
                        key: 'doctype',
                        origin: 'value',
                        type: 'object',
                        value: 'org.iso.18013.5.1.mDL',
                      },
                    ],
                    received: '"org.iso.18013.5.1.mDL"',
                    requirement: undefined,
                    type: 'literal',
                  },
                  {
                    abortEarly: undefined,
                    abortPipeEarly: undefined,
                    expected: 'Object',
                    input: undefined,
                    issues: undefined,
                    kind: 'schema',
                    lang: undefined,
                    message: 'Invalid type: Expected Object but received undefined',
                    path: [
                      {
                        input: {
                          credential_format: 'mso_mdoc',
                          doctype: 'org.iso.18013.5.1.mDL',
                          namespaces: {
                            'org.iso.18013.5.1': {
                              non_disclosed: 'secret',
                              resident_address: 'Via Roma 1',
                              resident_country: 'Italy',
                            },
                          },
                        },
                        key: 'namespaces',
                        origin: 'value',
                        type: 'object',
                        value: {
                          'org.iso.18013.5.1': {
                            non_disclosed: 'secret',
                            resident_address: 'Via Roma 1',
                            resident_country: 'Italy',
                          },
                        },
                      },
                      {
                        input: {
                          'org.iso.18013.5.1': {
                            non_disclosed: 'secret',
                            resident_address: 'Via Roma 1',
                            resident_country: 'Italy',
                          },
                        },
                        key: 'org.iso.23220.1',
                        origin: 'value',
                        type: 'object',
                        value: undefined,
                      },
                    ],
                    received: 'undefined',
                    requirement: undefined,
                    type: 'object',
                  },
                ],
                output: {
                  credential_format: 'mso_mdoc',
                  doctype: 'org.iso.18013.5.1.mDL',
                  namespaces: {},
                },
                success: false,
                typed: false,
              },
              {
                claim_set_index: undefined,
                input_credential_index: 2,
                issues: undefined,
                output: {
                  credential_format: 'mso_mdoc',
                  doctype: 'org.iso.23220.photoid.1',
                  namespaces: {
                    'org.iso.23220.1': {
                      family_name: 'Auer',
                      given_name: 'Martin',
                      portrait: 'https://example.com/portrait',
                    },
                  },
                },
                success: true,
                typed: true,
              },
              {
                claim_set_index: undefined,
                flattened: {
                  nested: {
                    'namespaces.org.iso.23220.1.family_name': [
                      'Invalid type: Expected (!null & !undefined) but received undefined',
                    ],
                    'namespaces.org.iso.23220.1.given_name': [
                      'Invalid type: Expected (!null & !undefined) but received undefined',
                    ],
                    'namespaces.org.iso.23220.1.portrait': [
                      'Invalid type: Expected (!null & !undefined) but received undefined',
                    ],
                  },
                },
                input_credential_index: 3,
                issues: [
                  {
                    abortEarly: undefined,
                    abortPipeEarly: undefined,
                    expected: '(!null & !undefined)',
                    input: undefined,
                    issues: undefined,
                    kind: 'schema',
                    lang: undefined,
                    message: 'Invalid type: Expected (!null & !undefined) but received undefined',
                    path: [
                      {
                        input: {
                          credential_format: 'mso_mdoc',
                          doctype: 'org.iso.23220.photoid.1',
                          namespaces: {
                            'org.iso.23220.1': {
                              non_disclosed: 'secret',
                              resident_address: 'Via Roma 1',
                              resident_country: 'Italy',
                            },
                          },
                        },
                        key: 'namespaces',
                        origin: 'value',
                        type: 'object',
                        value: {
                          'org.iso.23220.1': {
                            non_disclosed: 'secret',
                            resident_address: 'Via Roma 1',
                            resident_country: 'Italy',
                          },
                        },
                      },
                      {
                        input: {
                          'org.iso.23220.1': {
                            non_disclosed: 'secret',
                            resident_address: 'Via Roma 1',
                            resident_country: 'Italy',
                          },
                        },
                        key: 'org.iso.23220.1',
                        origin: 'value',
                        type: 'object',
                        value: {
                          non_disclosed: 'secret',
                          resident_address: 'Via Roma 1',
                          resident_country: 'Italy',
                        },
                      },
                      {
                        input: {
                          non_disclosed: 'secret',
                          resident_address: 'Via Roma 1',
                          resident_country: 'Italy',
                        },
                        key: 'given_name',
                        origin: 'value',
                        type: 'object',
                        value: undefined,
                      },
                    ],
                    received: 'undefined',
                    requirement: undefined,
                    type: 'non_nullish',
                  },
                  {
                    abortEarly: undefined,
                    abortPipeEarly: undefined,
                    expected: '(!null & !undefined)',
                    input: undefined,
                    issues: undefined,
                    kind: 'schema',
                    lang: undefined,
                    message: 'Invalid type: Expected (!null & !undefined) but received undefined',
                    path: [
                      {
                        input: {
                          credential_format: 'mso_mdoc',
                          doctype: 'org.iso.23220.photoid.1',
                          namespaces: {
                            'org.iso.23220.1': {
                              non_disclosed: 'secret',
                              resident_address: 'Via Roma 1',
                              resident_country: 'Italy',
                            },
                          },
                        },
                        key: 'namespaces',
                        origin: 'value',
                        type: 'object',
                        value: {
                          'org.iso.23220.1': {
                            non_disclosed: 'secret',
                            resident_address: 'Via Roma 1',
                            resident_country: 'Italy',
                          },
                        },
                      },
                      {
                        input: {
                          'org.iso.23220.1': {
                            non_disclosed: 'secret',
                            resident_address: 'Via Roma 1',
                            resident_country: 'Italy',
                          },
                        },
                        key: 'org.iso.23220.1',
                        origin: 'value',
                        type: 'object',
                        value: {
                          non_disclosed: 'secret',
                          resident_address: 'Via Roma 1',
                          resident_country: 'Italy',
                        },
                      },
                      {
                        input: {
                          non_disclosed: 'secret',
                          resident_address: 'Via Roma 1',
                          resident_country: 'Italy',
                        },
                        key: 'family_name',
                        origin: 'value',
                        type: 'object',
                        value: undefined,
                      },
                    ],
                    received: 'undefined',
                    requirement: undefined,
                    type: 'non_nullish',
                  },
                  {
                    abortEarly: undefined,
                    abortPipeEarly: undefined,
                    expected: '(!null & !undefined)',
                    input: undefined,
                    issues: undefined,
                    kind: 'schema',
                    lang: undefined,
                    message: 'Invalid type: Expected (!null & !undefined) but received undefined',
                    path: [
                      {
                        input: {
                          credential_format: 'mso_mdoc',
                          doctype: 'org.iso.23220.photoid.1',
                          namespaces: {
                            'org.iso.23220.1': {
                              non_disclosed: 'secret',
                              resident_address: 'Via Roma 1',
                              resident_country: 'Italy',
                            },
                          },
                        },
                        key: 'namespaces',
                        origin: 'value',
                        type: 'object',
                        value: {
                          'org.iso.23220.1': {
                            non_disclosed: 'secret',
                            resident_address: 'Via Roma 1',
                            resident_country: 'Italy',
                          },
                        },
                      },
                      {
                        input: {
                          'org.iso.23220.1': {
                            non_disclosed: 'secret',
                            resident_address: 'Via Roma 1',
                            resident_country: 'Italy',
                          },
                        },
                        key: 'org.iso.23220.1',
                        origin: 'value',
                        type: 'object',
                        value: {
                          non_disclosed: 'secret',
                          resident_address: 'Via Roma 1',
                          resident_country: 'Italy',
                        },
                      },
                      {
                        input: {
                          non_disclosed: 'secret',
                          resident_address: 'Via Roma 1',
                          resident_country: 'Italy',
                        },
                        key: 'portrait',
                        origin: 'value',
                        type: 'object',
                        value: undefined,
                      },
                    ],
                    received: 'undefined',
                    requirement: undefined,
                    type: 'non_nullish',
                  },
                ],
                output: {
                  credential_format: 'mso_mdoc',
                  doctype: 'org.iso.23220.photoid.1',
                  namespaces: {
                    'org.iso.23220.1': {},
                  },
                },
                success: false,
                typed: false,
              },
              {
                claim_set_index: undefined,
                flattened: {
                  nested: {
                    doctype: ['Invalid type: Expected "org.iso.23220.photoid.1" but received "example_doctype"'],
                    'namespaces.org.iso.23220.1': ['Invalid type: Expected Object but received undefined'],
                  },
                },
                input_credential_index: 4,
                issues: [
                  {
                    abortEarly: undefined,
                    abortPipeEarly: undefined,
                    expected: '"org.iso.23220.photoid.1"',
                    input: 'example_doctype',
                    issues: undefined,
                    kind: 'schema',
                    lang: undefined,
                    message: 'Invalid type: Expected "org.iso.23220.photoid.1" but received "example_doctype"',
                    path: [
                      {
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
                        origin: 'value',
                        type: 'object',
                        value: 'example_doctype',
                      },
                    ],
                    received: '"example_doctype"',
                    requirement: undefined,
                    type: 'literal',
                  },
                  {
                    abortEarly: undefined,
                    abortPipeEarly: undefined,
                    expected: 'Object',
                    input: undefined,
                    issues: undefined,
                    kind: 'schema',
                    lang: undefined,
                    message: 'Invalid type: Expected Object but received undefined',
                    path: [
                      {
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
                        origin: 'value',
                        type: 'object',
                        value: {
                          example_namespaces: {
                            example_claim: 'example_value',
                          },
                        },
                      },
                      {
                        input: {
                          example_namespaces: {
                            example_claim: 'example_value',
                          },
                        },
                        key: 'org.iso.23220.1',
                        origin: 'value',
                        type: 'object',
                        value: undefined,
                      },
                    ],
                    received: 'undefined',
                    requirement: undefined,
                    type: 'object',
                  },
                ],
                output: {
                  credential_format: 'mso_mdoc',
                  doctype: 'example_doctype',
                  namespaces: {},
                },
                success: false,
                typed: false,
              },
              {
                claim_set_index: undefined,
                flattened: {
                  nested: {
                    credential_format: ['Invalid type: Expected "mso_mdoc" but received "vc+sd-jwt"'],
                    doctype: ['Invalid type: Expected "org.iso.23220.photoid.1" but received undefined'],
                    namespaces: ['Invalid type: Expected Object but received undefined'],
                  },
                },
                input_credential_index: 5,
                issues: [
                  {
                    abortEarly: undefined,
                    abortPipeEarly: undefined,
                    expected: '"mso_mdoc"',
                    input: 'vc+sd-jwt',
                    issues: undefined,
                    kind: 'schema',
                    lang: undefined,
                    message: 'Invalid type: Expected "mso_mdoc" but received "vc+sd-jwt"',
                    path: [
                      {
                        input: {
                          claims: {
                            address: {
                              locality: 'Milliways',
                              postal_code: '12345',
                              street_address: '42 Market Street',
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
                            first_name: 'Arthur',
                            last_name: 'Dent',
                            nationalities: ['British', 'Betelgeusian'],
                          },
                          credential_format: 'vc+sd-jwt',
                          vct: 'https://credentials.example.com/identity_credential',
                        },
                        key: 'credential_format',
                        origin: 'value',
                        type: 'object',
                        value: 'vc+sd-jwt',
                      },
                    ],
                    received: '"vc+sd-jwt"',
                    requirement: undefined,
                    type: 'literal',
                  },
                  {
                    abortEarly: undefined,
                    abortPipeEarly: undefined,
                    expected: '"org.iso.23220.photoid.1"',
                    input: undefined,
                    issues: undefined,
                    kind: 'schema',
                    lang: undefined,
                    message: 'Invalid type: Expected "org.iso.23220.photoid.1" but received undefined',
                    path: [
                      {
                        input: {
                          claims: {
                            address: {
                              locality: 'Milliways',
                              postal_code: '12345',
                              street_address: '42 Market Street',
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
                            first_name: 'Arthur',
                            last_name: 'Dent',
                            nationalities: ['British', 'Betelgeusian'],
                          },
                          credential_format: 'vc+sd-jwt',
                          vct: 'https://credentials.example.com/identity_credential',
                        },
                        key: 'doctype',
                        origin: 'value',
                        type: 'object',
                        value: undefined,
                      },
                    ],
                    received: 'undefined',
                    requirement: undefined,
                    type: 'literal',
                  },
                  {
                    abortEarly: undefined,
                    abortPipeEarly: undefined,
                    expected: 'Object',
                    input: undefined,
                    issues: undefined,
                    kind: 'schema',
                    lang: undefined,
                    message: 'Invalid type: Expected Object but received undefined',
                    path: [
                      {
                        input: {
                          claims: {
                            address: {
                              locality: 'Milliways',
                              postal_code: '12345',
                              street_address: '42 Market Street',
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
                            first_name: 'Arthur',
                            last_name: 'Dent',
                            nationalities: ['British', 'Betelgeusian'],
                          },
                          credential_format: 'vc+sd-jwt',
                          vct: 'https://credentials.example.com/identity_credential',
                        },
                        key: 'namespaces',
                        origin: 'value',
                        type: 'object',
                        value: undefined,
                      },
                    ],
                    received: 'undefined',
                    requirement: undefined,
                    type: 'object',
                  },
                ],
                output: {
                  credential_format: 'vc+sd-jwt',
                },
                success: false,
                typed: false,
              },
            ],
          ],
          claim_set_index: undefined,
          input_credential_index: 2,
          output: {
            credential_format: 'mso_mdoc',
            doctype: 'org.iso.23220.photoid.1',
            namespaces: {
              'org.iso.23220.1': {
                family_name: 'Auer',
                given_name: 'Martin',
                portrait: 'https://example.com/portrait',
              },
            },
          },
          success: true,
          typed: true,
        },
      },
      credential_sets: [
        {
          matching_options: [['mdl-id'], ['photo_card-id']],
          options: [['mdl-id'], ['photo_card-id']],
          purpose: 'Identification',
          required: true,
        },
        {
          matching_options: [['mdl-address'], ['photo_card-address']],
          options: [['mdl-address'], ['photo_card-address']],
          purpose: 'Proof of address',
          required: false,
        },
      ],
      credentials: [
        {
          claims: [
            {
              claim_name: 'given_name',
              id: 'given_name',
              namespace: 'org.iso.18013.5.1',
            },
            {
              claim_name: 'family_name',
              id: 'family_name',
              namespace: 'org.iso.18013.5.1',
            },
            {
              claim_name: 'portrait',
              id: 'portrait',
              namespace: 'org.iso.18013.5.1',
            },
          ],
          format: 'mso_mdoc',
          id: 'mdl-id',
          meta: {
            doctype_value: 'org.iso.18013.5.1.mDL',
          },
          require_cryptographic_holder_binding: true,
        },
        {
          claims: [
            {
              id: 'resident_address',
              intent_to_retain: false,
              path: ['org.iso.18013.5.1', 'resident_address'],
            },
            {
              id: 'resident_country',
              intent_to_retain: true,
              path: ['org.iso.18013.5.1', 'resident_country'],
            },
          ],
          format: 'mso_mdoc',
          id: 'mdl-address',
          meta: {
            doctype_value: 'org.iso.18013.5.1.mDL',
          },
          require_cryptographic_holder_binding: true,
        },
        {
          claims: [
            {
              id: 'given_name',
              path: ['org.iso.23220.1', 'given_name'],
            },
            {
              id: 'family_name',
              path: ['org.iso.23220.1', 'family_name'],
            },
            {
              id: 'portrait',
              path: ['org.iso.23220.1', 'portrait'],
            },
          ],
          format: 'mso_mdoc',
          id: 'photo_card-id',
          meta: {
            doctype_value: 'org.iso.23220.photoid.1',
          },
          require_cryptographic_holder_binding: true,
        },
        {
          claims: [
            {
              id: 'resident_address',
              path: ['org.iso.23220.1', 'resident_address'],
            },
            {
              id: 'resident_country',
              path: ['org.iso.23220.1', 'resident_country'],
            },
          ],
          format: 'mso_mdoc',
          id: 'photo_card-address',
          meta: {
            doctype_value: 'org.iso.23220.photoid.1',
          },
          require_cryptographic_holder_binding: true,
        },
      ],
    })

    const presentationQueryResult = DcqlPresentationResult.fromDcqlPresentation(
      {
        'mdl-id': {
          ...res.credential_matches['mdl-id'].output,
          includes_cryptographic_holder_binding: true,
        },
        'mdl-address': {
          ...res.credential_matches['mdl-address'].output,
          includes_cryptographic_holder_binding: true,
        },
        'photo_card-address': {
          ...res.credential_matches['photo_card-address'].output,
          includes_cryptographic_holder_binding: true,
        },
        'photo_card-id': {
          ...res.credential_matches['photo_card-id'].output,
          includes_cryptographic_holder_binding: true,
        },
        // biome-ignore lint/suspicious/noExplicitAny: <explanation>
      } as any,
      { dcqlQuery: query }
    )

    assert.deepStrictEqual(presentationQueryResult, {
      credentials: [
        {
          id: 'mdl-id',
          format: 'mso_mdoc',
          require_cryptographic_holder_binding: true,
          claims: [
            {
              id: 'given_name',
              namespace: 'org.iso.18013.5.1',
              claim_name: 'given_name',
            },
            {
              id: 'family_name',
              namespace: 'org.iso.18013.5.1',
              claim_name: 'family_name',
            },
            {
              id: 'portrait',
              namespace: 'org.iso.18013.5.1',
              claim_name: 'portrait',
            },
          ],
          meta: {
            doctype_value: 'org.iso.18013.5.1.mDL',
          },
        },
        {
          id: 'mdl-address',
          format: 'mso_mdoc',
          require_cryptographic_holder_binding: true,
          claims: [
            {
              id: 'resident_address',
              path: ['org.iso.18013.5.1', 'resident_address'],
              intent_to_retain: false,
            },
            {
              id: 'resident_country',
              path: ['org.iso.18013.5.1', 'resident_country'],
              intent_to_retain: true,
            },
          ],
          meta: {
            doctype_value: 'org.iso.18013.5.1.mDL',
          },
        },
        {
          id: 'photo_card-id',
          format: 'mso_mdoc',
          require_cryptographic_holder_binding: true,
          claims: [
            {
              id: 'given_name',
              path: ['org.iso.23220.1', 'given_name'],
            },
            {
              id: 'family_name',
              path: ['org.iso.23220.1', 'family_name'],
            },
            {
              id: 'portrait',
              path: ['org.iso.23220.1', 'portrait'],
            },
          ],
          meta: {
            doctype_value: 'org.iso.23220.photoid.1',
          },
        },
        {
          id: 'photo_card-address',
          format: 'mso_mdoc',
          require_cryptographic_holder_binding: true,
          claims: [
            {
              id: 'resident_address',
              path: ['org.iso.23220.1', 'resident_address'],
            },
            {
              id: 'resident_country',
              path: ['org.iso.23220.1', 'resident_country'],
            },
          ],
          meta: {
            doctype_value: 'org.iso.23220.photoid.1',
          },
        },
      ],
      credential_sets: [
        {
          options: [['mdl-id'], ['photo_card-id']],
          required: true,
          purpose: 'Identification',
          matching_options: [['mdl-id'], ['photo_card-id']],
        },
        {
          options: [['mdl-address'], ['photo_card-address']],
          required: false,
          purpose: 'Proof of address',
          matching_options: [['mdl-address'], ['photo_card-address']],
        },
      ],
      canBeSatisfied: true,
      valid_matches: {
        'mdl-id': {
          typed: true,
          success: true,
          output: {
            credential_format: 'mso_mdoc',
            includes_cryptographic_holder_binding: true,
            doctype: 'org.iso.18013.5.1.mDL',
            namespaces: {
              'org.iso.18013.5.1': {
                given_name: 'Martin',
                family_name: 'Auer',
                portrait: 'https://example.com/portrait',
              },
            },
          },
          claim_set_index: undefined,
          presentation_id: 'mdl-id',
        },
        'mdl-address': {
          typed: true,
          success: true,
          output: {
            credential_format: 'mso_mdoc',
            includes_cryptographic_holder_binding: true,
            doctype: 'org.iso.18013.5.1.mDL',
            namespaces: {
              'org.iso.18013.5.1': {
                resident_address: 'Via Roma 1',
                resident_country: 'Italy',
              },
            },
          },
          claim_set_index: undefined,
          presentation_id: 'mdl-address',
        },
        'photo_card-address': {
          typed: true,
          success: true,
          output: {
            credential_format: 'mso_mdoc',
            includes_cryptographic_holder_binding: true,
            doctype: 'org.iso.23220.photoid.1',
            namespaces: {
              'org.iso.23220.1': {
                resident_address: 'Via Roma 1',
                resident_country: 'Italy',
              },
            },
          },
          claim_set_index: undefined,
          presentation_id: 'photo_card-address',
        },
        'photo_card-id': {
          typed: true,
          success: true,
          output: {
            credential_format: 'mso_mdoc',
            includes_cryptographic_holder_binding: true,
            doctype: 'org.iso.23220.photoid.1',
            namespaces: {
              'org.iso.23220.1': {
                given_name: 'Martin',
                family_name: 'Auer',
                portrait: 'https://example.com/portrait',
              },
            },
          },
          claim_set_index: undefined,
          presentation_id: 'photo_card-id',
        },
      },
      invalid_matches: undefined,
    })
  })
})
