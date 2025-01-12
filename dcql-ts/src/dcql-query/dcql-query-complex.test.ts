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
          namespace: 'org.iso.18013.5.1',
          claim_name: 'resident_address',
        },
        {
          id: 'resident_country',
          namespace: 'org.iso.18013.5.1',
          claim_name: 'resident_country',
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
          namespace: 'org.iso.23220.1',
          claim_name: 'given_name',
        },
        {
          id: 'family_name',
          namespace: 'org.iso.23220.1',
          claim_name: 'family_name',
        },
        {
          id: 'portrait',
          namespace: 'org.iso.23220.1',
          claim_name: 'portrait',
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
          namespace: 'org.iso.23220.1',
          claim_name: 'resident_address',
        },
        {
          id: 'resident_country',
          namespace: 'org.iso.23220.1',
          claim_name: 'resident_country',
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
      credentials: complexMdocQuery.credentials,
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
      credential_matches: {
        'mdl-id': {
          typed: true,
          success: true,
          output: {
            credential_format: 'mso_mdoc',
            doctype: 'org.iso.18013.5.1.mDL',
            namespaces: {
              'org.iso.18013.5.1': {
                given_name: 'Martin',
                family_name: 'Auer',
                portrait: 'https://example.com/portrait',
              },
            },
          },
          input_credential_index: 0,
          claim_set_index: undefined,
          all: [
            [
              {
                typed: true,
                success: true,
                output: {
                  credential_format: 'mso_mdoc',
                  doctype: 'org.iso.18013.5.1.mDL',
                  namespaces: {
                    'org.iso.18013.5.1': {
                      given_name: 'Martin',
                      family_name: 'Auer',
                      portrait: 'https://example.com/portrait',
                    },
                  },
                },
                issues: undefined,
                input_credential_index: 0,
                claim_set_index: undefined,
              },
              {
                typed: false,
                success: false,
                output: {
                  credential_format: 'mso_mdoc',
                  doctype: 'org.iso.18013.5.1.mDL',
                  namespaces: {
                    'org.iso.18013.5.1': {},
                  },
                },
                issues: [
                  {
                    kind: 'schema',
                    type: 'non_nullish',
                    input: undefined,
                    expected: '(!null & !undefined)',
                    received: 'undefined',
                    message: 'Invalid type: Expected (!null & !undefined) but received undefined',
                    requirement: undefined,
                    path: [
                      {
                        type: 'object',
                        origin: 'value',
                        input: {
                          credential_format: 'mso_mdoc',
                          doctype: 'org.iso.18013.5.1.mDL',
                          namespaces: {
                            'org.iso.18013.5.1': {
                              resident_country: 'Italy',
                              resident_address: 'Via Roma 1',
                              non_disclosed: 'secret',
                            },
                          },
                        },
                        key: 'namespaces',
                        value: {
                          'org.iso.18013.5.1': {
                            resident_country: 'Italy',
                            resident_address: 'Via Roma 1',
                            non_disclosed: 'secret',
                          },
                        },
                      },
                      {
                        type: 'object',
                        origin: 'value',
                        input: {
                          'org.iso.18013.5.1': {
                            resident_country: 'Italy',
                            resident_address: 'Via Roma 1',
                            non_disclosed: 'secret',
                          },
                        },
                        key: 'org.iso.18013.5.1',
                        value: {
                          resident_country: 'Italy',
                          resident_address: 'Via Roma 1',
                          non_disclosed: 'secret',
                        },
                      },
                      {
                        type: 'object',
                        origin: 'value',
                        input: {
                          resident_country: 'Italy',
                          resident_address: 'Via Roma 1',
                          non_disclosed: 'secret',
                        },
                        key: 'given_name',
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
                    type: 'non_nullish',
                    input: undefined,
                    expected: '(!null & !undefined)',
                    received: 'undefined',
                    message: 'Invalid type: Expected (!null & !undefined) but received undefined',
                    requirement: undefined,
                    path: [
                      {
                        type: 'object',
                        origin: 'value',
                        input: {
                          credential_format: 'mso_mdoc',
                          doctype: 'org.iso.18013.5.1.mDL',
                          namespaces: {
                            'org.iso.18013.5.1': {
                              resident_country: 'Italy',
                              resident_address: 'Via Roma 1',
                              non_disclosed: 'secret',
                            },
                          },
                        },
                        key: 'namespaces',
                        value: {
                          'org.iso.18013.5.1': {
                            resident_country: 'Italy',
                            resident_address: 'Via Roma 1',
                            non_disclosed: 'secret',
                          },
                        },
                      },
                      {
                        type: 'object',
                        origin: 'value',
                        input: {
                          'org.iso.18013.5.1': {
                            resident_country: 'Italy',
                            resident_address: 'Via Roma 1',
                            non_disclosed: 'secret',
                          },
                        },
                        key: 'org.iso.18013.5.1',
                        value: {
                          resident_country: 'Italy',
                          resident_address: 'Via Roma 1',
                          non_disclosed: 'secret',
                        },
                      },
                      {
                        type: 'object',
                        origin: 'value',
                        input: {
                          resident_country: 'Italy',
                          resident_address: 'Via Roma 1',
                          non_disclosed: 'secret',
                        },
                        key: 'family_name',
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
                    type: 'non_nullish',
                    input: undefined,
                    expected: '(!null & !undefined)',
                    received: 'undefined',
                    message: 'Invalid type: Expected (!null & !undefined) but received undefined',
                    requirement: undefined,
                    path: [
                      {
                        type: 'object',
                        origin: 'value',
                        input: {
                          credential_format: 'mso_mdoc',
                          doctype: 'org.iso.18013.5.1.mDL',
                          namespaces: {
                            'org.iso.18013.5.1': {
                              resident_country: 'Italy',
                              resident_address: 'Via Roma 1',
                              non_disclosed: 'secret',
                            },
                          },
                        },
                        key: 'namespaces',
                        value: {
                          'org.iso.18013.5.1': {
                            resident_country: 'Italy',
                            resident_address: 'Via Roma 1',
                            non_disclosed: 'secret',
                          },
                        },
                      },
                      {
                        type: 'object',
                        origin: 'value',
                        input: {
                          'org.iso.18013.5.1': {
                            resident_country: 'Italy',
                            resident_address: 'Via Roma 1',
                            non_disclosed: 'secret',
                          },
                        },
                        key: 'org.iso.18013.5.1',
                        value: {
                          resident_country: 'Italy',
                          resident_address: 'Via Roma 1',
                          non_disclosed: 'secret',
                        },
                      },
                      {
                        type: 'object',
                        origin: 'value',
                        input: {
                          resident_country: 'Italy',
                          resident_address: 'Via Roma 1',
                          non_disclosed: 'secret',
                        },
                        key: 'portrait',
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
                    'namespaces.org.iso.18013.5.1.given_name': [
                      'Invalid type: Expected (!null & !undefined) but received undefined',
                    ],
                    'namespaces.org.iso.18013.5.1.family_name': [
                      'Invalid type: Expected (!null & !undefined) but received undefined',
                    ],
                    'namespaces.org.iso.18013.5.1.portrait': [
                      'Invalid type: Expected (!null & !undefined) but received undefined',
                    ],
                  },
                },
                input_credential_index: 1,
                claim_set_index: undefined,
              },
              {
                typed: false,
                success: false,
                output: {
                  credential_format: 'mso_mdoc',
                  doctype: 'org.iso.23220.photoid.1',
                  namespaces: {},
                },
                issues: [
                  {
                    kind: 'schema',
                    type: 'literal',
                    input: 'org.iso.23220.photoid.1',
                    expected: '"org.iso.18013.5.1.mDL"',
                    received: '"org.iso.23220.photoid.1"',
                    message: 'Invalid type: Expected "org.iso.18013.5.1.mDL" but received "org.iso.23220.photoid.1"',
                    requirement: undefined,
                    path: [
                      {
                        type: 'object',
                        origin: 'value',
                        input: {
                          credential_format: 'mso_mdoc',
                          doctype: 'org.iso.23220.photoid.1',
                          namespaces: {
                            'org.iso.23220.1': {
                              given_name: 'Martin',
                              family_name: 'Auer',
                              portrait: 'https://example.com/portrait',
                            },
                          },
                        },
                        key: 'doctype',
                        value: 'org.iso.23220.photoid.1',
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
                          doctype: 'org.iso.23220.photoid.1',
                          namespaces: {
                            'org.iso.23220.1': {
                              given_name: 'Martin',
                              family_name: 'Auer',
                              portrait: 'https://example.com/portrait',
                            },
                          },
                        },
                        key: 'namespaces',
                        value: {
                          'org.iso.23220.1': {
                            given_name: 'Martin',
                            family_name: 'Auer',
                            portrait: 'https://example.com/portrait',
                          },
                        },
                      },
                      {
                        type: 'object',
                        origin: 'value',
                        input: {
                          'org.iso.23220.1': {
                            given_name: 'Martin',
                            family_name: 'Auer',
                            portrait: 'https://example.com/portrait',
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
                    doctype: ['Invalid type: Expected "org.iso.18013.5.1.mDL" but received "org.iso.23220.photoid.1"'],
                    'namespaces.org.iso.18013.5.1': ['Invalid type: Expected Object but received undefined'],
                  },
                },
                input_credential_index: 2,
                claim_set_index: undefined,
              },
              {
                typed: false,
                success: false,
                output: {
                  credential_format: 'mso_mdoc',
                  doctype: 'org.iso.23220.photoid.1',
                  namespaces: {},
                },
                issues: [
                  {
                    kind: 'schema',
                    type: 'literal',
                    input: 'org.iso.23220.photoid.1',
                    expected: '"org.iso.18013.5.1.mDL"',
                    received: '"org.iso.23220.photoid.1"',
                    message: 'Invalid type: Expected "org.iso.18013.5.1.mDL" but received "org.iso.23220.photoid.1"',
                    requirement: undefined,
                    path: [
                      {
                        type: 'object',
                        origin: 'value',
                        input: {
                          credential_format: 'mso_mdoc',
                          doctype: 'org.iso.23220.photoid.1',
                          namespaces: {
                            'org.iso.23220.1': {
                              resident_country: 'Italy',
                              resident_address: 'Via Roma 1',
                              non_disclosed: 'secret',
                            },
                          },
                        },
                        key: 'doctype',
                        value: 'org.iso.23220.photoid.1',
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
                          doctype: 'org.iso.23220.photoid.1',
                          namespaces: {
                            'org.iso.23220.1': {
                              resident_country: 'Italy',
                              resident_address: 'Via Roma 1',
                              non_disclosed: 'secret',
                            },
                          },
                        },
                        key: 'namespaces',
                        value: {
                          'org.iso.23220.1': {
                            resident_country: 'Italy',
                            resident_address: 'Via Roma 1',
                            non_disclosed: 'secret',
                          },
                        },
                      },
                      {
                        type: 'object',
                        origin: 'value',
                        input: {
                          'org.iso.23220.1': {
                            resident_country: 'Italy',
                            resident_address: 'Via Roma 1',
                            non_disclosed: 'secret',
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
                    doctype: ['Invalid type: Expected "org.iso.18013.5.1.mDL" but received "org.iso.23220.photoid.1"'],
                    'namespaces.org.iso.18013.5.1': ['Invalid type: Expected Object but received undefined'],
                  },
                },
                input_credential_index: 3,
                claim_set_index: undefined,
              },
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
                    expected: '"org.iso.18013.5.1.mDL"',
                    received: '"example_doctype"',
                    message: 'Invalid type: Expected "org.iso.18013.5.1.mDL" but received "example_doctype"',
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
                    doctype: ['Invalid type: Expected "org.iso.18013.5.1.mDL" but received "example_doctype"'],
                    'namespaces.org.iso.18013.5.1': ['Invalid type: Expected Object but received undefined'],
                  },
                },
                input_credential_index: 4,
                claim_set_index: undefined,
              },
              {
                typed: false,
                success: false,
                output: {
                  credential_format: 'vc+sd-jwt',
                },
                issues: [
                  {
                    kind: 'schema',
                    type: 'literal',
                    input: 'vc+sd-jwt',
                    expected: '"mso_mdoc"',
                    received: '"vc+sd-jwt"',
                    message: 'Invalid type: Expected "mso_mdoc" but received "vc+sd-jwt"',
                    requirement: undefined,
                    path: [
                      {
                        type: 'object',
                        origin: 'value',
                        input: {
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
                        },
                        key: 'credential_format',
                        value: 'vc+sd-jwt',
                      },
                    ],
                    issues: undefined,
                    lang: undefined,
                    abortEarly: undefined,
                    abortPipeEarly: undefined,
                  },
                  {
                    kind: 'schema',
                    type: 'literal',
                    input: undefined,
                    expected: '"org.iso.18013.5.1.mDL"',
                    received: 'undefined',
                    message: 'Invalid type: Expected "org.iso.18013.5.1.mDL" but received undefined',
                    requirement: undefined,
                    path: [
                      {
                        type: 'object',
                        origin: 'value',
                        input: {
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
                        },
                        key: 'doctype',
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
                        },
                        key: 'namespaces',
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
                    credential_format: ['Invalid type: Expected "mso_mdoc" but received "vc+sd-jwt"'],
                    doctype: ['Invalid type: Expected "org.iso.18013.5.1.mDL" but received undefined'],
                    namespaces: ['Invalid type: Expected Object but received undefined'],
                  },
                },
                input_credential_index: 5,
                claim_set_index: undefined,
              },
            ],
          ],
        },
        'mdl-address': {
          typed: true,
          success: true,
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
          input_credential_index: 1,
          claim_set_index: undefined,
          all: [
            [
              {
                typed: false,
                success: false,
                output: {
                  credential_format: 'mso_mdoc',
                  doctype: 'org.iso.18013.5.1.mDL',
                  namespaces: {
                    'org.iso.18013.5.1': {},
                  },
                },
                issues: [
                  {
                    kind: 'schema',
                    type: 'non_nullish',
                    input: undefined,
                    expected: '(!null & !undefined)',
                    received: 'undefined',
                    message: 'Invalid type: Expected (!null & !undefined) but received undefined',
                    requirement: undefined,
                    path: [
                      {
                        type: 'object',
                        origin: 'value',
                        input: {
                          credential_format: 'mso_mdoc',
                          doctype: 'org.iso.18013.5.1.mDL',
                          namespaces: {
                            'org.iso.18013.5.1': {
                              given_name: 'Martin',
                              family_name: 'Auer',
                              portrait: 'https://example.com/portrait',
                            },
                          },
                        },
                        key: 'namespaces',
                        value: {
                          'org.iso.18013.5.1': {
                            given_name: 'Martin',
                            family_name: 'Auer',
                            portrait: 'https://example.com/portrait',
                          },
                        },
                      },
                      {
                        type: 'object',
                        origin: 'value',
                        input: {
                          'org.iso.18013.5.1': {
                            given_name: 'Martin',
                            family_name: 'Auer',
                            portrait: 'https://example.com/portrait',
                          },
                        },
                        key: 'org.iso.18013.5.1',
                        value: {
                          given_name: 'Martin',
                          family_name: 'Auer',
                          portrait: 'https://example.com/portrait',
                        },
                      },
                      {
                        type: 'object',
                        origin: 'value',
                        input: {
                          given_name: 'Martin',
                          family_name: 'Auer',
                          portrait: 'https://example.com/portrait',
                        },
                        key: 'resident_address',
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
                    type: 'non_nullish',
                    input: undefined,
                    expected: '(!null & !undefined)',
                    received: 'undefined',
                    message: 'Invalid type: Expected (!null & !undefined) but received undefined',
                    requirement: undefined,
                    path: [
                      {
                        type: 'object',
                        origin: 'value',
                        input: {
                          credential_format: 'mso_mdoc',
                          doctype: 'org.iso.18013.5.1.mDL',
                          namespaces: {
                            'org.iso.18013.5.1': {
                              given_name: 'Martin',
                              family_name: 'Auer',
                              portrait: 'https://example.com/portrait',
                            },
                          },
                        },
                        key: 'namespaces',
                        value: {
                          'org.iso.18013.5.1': {
                            given_name: 'Martin',
                            family_name: 'Auer',
                            portrait: 'https://example.com/portrait',
                          },
                        },
                      },
                      {
                        type: 'object',
                        origin: 'value',
                        input: {
                          'org.iso.18013.5.1': {
                            given_name: 'Martin',
                            family_name: 'Auer',
                            portrait: 'https://example.com/portrait',
                          },
                        },
                        key: 'org.iso.18013.5.1',
                        value: {
                          given_name: 'Martin',
                          family_name: 'Auer',
                          portrait: 'https://example.com/portrait',
                        },
                      },
                      {
                        type: 'object',
                        origin: 'value',
                        input: {
                          given_name: 'Martin',
                          family_name: 'Auer',
                          portrait: 'https://example.com/portrait',
                        },
                        key: 'resident_country',
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
                    'namespaces.org.iso.18013.5.1.resident_address': [
                      'Invalid type: Expected (!null & !undefined) but received undefined',
                    ],
                    'namespaces.org.iso.18013.5.1.resident_country': [
                      'Invalid type: Expected (!null & !undefined) but received undefined',
                    ],
                  },
                },
                input_credential_index: 0,
                claim_set_index: undefined,
              },
              {
                typed: true,
                success: true,
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
                issues: undefined,
                input_credential_index: 1,
                claim_set_index: undefined,
              },
              {
                typed: false,
                success: false,
                output: {
                  credential_format: 'mso_mdoc',
                  doctype: 'org.iso.23220.photoid.1',
                  namespaces: {},
                },
                issues: [
                  {
                    kind: 'schema',
                    type: 'literal',
                    input: 'org.iso.23220.photoid.1',
                    expected: '"org.iso.18013.5.1.mDL"',
                    received: '"org.iso.23220.photoid.1"',
                    message: 'Invalid type: Expected "org.iso.18013.5.1.mDL" but received "org.iso.23220.photoid.1"',
                    requirement: undefined,
                    path: [
                      {
                        type: 'object',
                        origin: 'value',
                        input: {
                          credential_format: 'mso_mdoc',
                          doctype: 'org.iso.23220.photoid.1',
                          namespaces: {
                            'org.iso.23220.1': {
                              given_name: 'Martin',
                              family_name: 'Auer',
                              portrait: 'https://example.com/portrait',
                            },
                          },
                        },
                        key: 'doctype',
                        value: 'org.iso.23220.photoid.1',
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
                          doctype: 'org.iso.23220.photoid.1',
                          namespaces: {
                            'org.iso.23220.1': {
                              given_name: 'Martin',
                              family_name: 'Auer',
                              portrait: 'https://example.com/portrait',
                            },
                          },
                        },
                        key: 'namespaces',
                        value: {
                          'org.iso.23220.1': {
                            given_name: 'Martin',
                            family_name: 'Auer',
                            portrait: 'https://example.com/portrait',
                          },
                        },
                      },
                      {
                        type: 'object',
                        origin: 'value',
                        input: {
                          'org.iso.23220.1': {
                            given_name: 'Martin',
                            family_name: 'Auer',
                            portrait: 'https://example.com/portrait',
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
                    doctype: ['Invalid type: Expected "org.iso.18013.5.1.mDL" but received "org.iso.23220.photoid.1"'],
                    'namespaces.org.iso.18013.5.1': ['Invalid type: Expected Object but received undefined'],
                  },
                },
                input_credential_index: 2,
                claim_set_index: undefined,
              },
              {
                typed: false,
                success: false,
                output: {
                  credential_format: 'mso_mdoc',
                  doctype: 'org.iso.23220.photoid.1',
                  namespaces: {},
                },
                issues: [
                  {
                    kind: 'schema',
                    type: 'literal',
                    input: 'org.iso.23220.photoid.1',
                    expected: '"org.iso.18013.5.1.mDL"',
                    received: '"org.iso.23220.photoid.1"',
                    message: 'Invalid type: Expected "org.iso.18013.5.1.mDL" but received "org.iso.23220.photoid.1"',
                    requirement: undefined,
                    path: [
                      {
                        type: 'object',
                        origin: 'value',
                        input: {
                          credential_format: 'mso_mdoc',
                          doctype: 'org.iso.23220.photoid.1',
                          namespaces: {
                            'org.iso.23220.1': {
                              resident_country: 'Italy',
                              resident_address: 'Via Roma 1',
                              non_disclosed: 'secret',
                            },
                          },
                        },
                        key: 'doctype',
                        value: 'org.iso.23220.photoid.1',
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
                          doctype: 'org.iso.23220.photoid.1',
                          namespaces: {
                            'org.iso.23220.1': {
                              resident_country: 'Italy',
                              resident_address: 'Via Roma 1',
                              non_disclosed: 'secret',
                            },
                          },
                        },
                        key: 'namespaces',
                        value: {
                          'org.iso.23220.1': {
                            resident_country: 'Italy',
                            resident_address: 'Via Roma 1',
                            non_disclosed: 'secret',
                          },
                        },
                      },
                      {
                        type: 'object',
                        origin: 'value',
                        input: {
                          'org.iso.23220.1': {
                            resident_country: 'Italy',
                            resident_address: 'Via Roma 1',
                            non_disclosed: 'secret',
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
                    doctype: ['Invalid type: Expected "org.iso.18013.5.1.mDL" but received "org.iso.23220.photoid.1"'],
                    'namespaces.org.iso.18013.5.1': ['Invalid type: Expected Object but received undefined'],
                  },
                },
                input_credential_index: 3,
                claim_set_index: undefined,
              },
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
                    expected: '"org.iso.18013.5.1.mDL"',
                    received: '"example_doctype"',
                    message: 'Invalid type: Expected "org.iso.18013.5.1.mDL" but received "example_doctype"',
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
                    doctype: ['Invalid type: Expected "org.iso.18013.5.1.mDL" but received "example_doctype"'],
                    'namespaces.org.iso.18013.5.1': ['Invalid type: Expected Object but received undefined'],
                  },
                },
                input_credential_index: 4,
                claim_set_index: undefined,
              },
              {
                typed: false,
                success: false,
                output: {
                  credential_format: 'vc+sd-jwt',
                },
                issues: [
                  {
                    kind: 'schema',
                    type: 'literal',
                    input: 'vc+sd-jwt',
                    expected: '"mso_mdoc"',
                    received: '"vc+sd-jwt"',
                    message: 'Invalid type: Expected "mso_mdoc" but received "vc+sd-jwt"',
                    requirement: undefined,
                    path: [
                      {
                        type: 'object',
                        origin: 'value',
                        input: {
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
                        },
                        key: 'credential_format',
                        value: 'vc+sd-jwt',
                      },
                    ],
                    issues: undefined,
                    lang: undefined,
                    abortEarly: undefined,
                    abortPipeEarly: undefined,
                  },
                  {
                    kind: 'schema',
                    type: 'literal',
                    input: undefined,
                    expected: '"org.iso.18013.5.1.mDL"',
                    received: 'undefined',
                    message: 'Invalid type: Expected "org.iso.18013.5.1.mDL" but received undefined',
                    requirement: undefined,
                    path: [
                      {
                        type: 'object',
                        origin: 'value',
                        input: {
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
                        },
                        key: 'doctype',
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
                        },
                        key: 'namespaces',
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
                    credential_format: ['Invalid type: Expected "mso_mdoc" but received "vc+sd-jwt"'],
                    doctype: ['Invalid type: Expected "org.iso.18013.5.1.mDL" but received undefined'],
                    namespaces: ['Invalid type: Expected Object but received undefined'],
                  },
                },
                input_credential_index: 5,
                claim_set_index: undefined,
              },
            ],
          ],
        },
        'photo_card-id': {
          typed: true,
          success: true,
          output: {
            credential_format: 'mso_mdoc',
            doctype: 'org.iso.23220.photoid.1',
            namespaces: {
              'org.iso.23220.1': {
                given_name: 'Martin',
                family_name: 'Auer',
                portrait: 'https://example.com/portrait',
              },
            },
          },
          input_credential_index: 2,
          claim_set_index: undefined,
          all: [
            [
              {
                typed: false,
                success: false,
                output: {
                  credential_format: 'mso_mdoc',
                  doctype: 'org.iso.18013.5.1.mDL',
                  namespaces: {},
                },
                issues: [
                  {
                    kind: 'schema',
                    type: 'literal',
                    input: 'org.iso.18013.5.1.mDL',
                    expected: '"org.iso.23220.photoid.1"',
                    received: '"org.iso.18013.5.1.mDL"',
                    message: 'Invalid type: Expected "org.iso.23220.photoid.1" but received "org.iso.18013.5.1.mDL"',
                    requirement: undefined,
                    path: [
                      {
                        type: 'object',
                        origin: 'value',
                        input: {
                          credential_format: 'mso_mdoc',
                          doctype: 'org.iso.18013.5.1.mDL',
                          namespaces: {
                            'org.iso.18013.5.1': {
                              given_name: 'Martin',
                              family_name: 'Auer',
                              portrait: 'https://example.com/portrait',
                            },
                          },
                        },
                        key: 'doctype',
                        value: 'org.iso.18013.5.1.mDL',
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
                          doctype: 'org.iso.18013.5.1.mDL',
                          namespaces: {
                            'org.iso.18013.5.1': {
                              given_name: 'Martin',
                              family_name: 'Auer',
                              portrait: 'https://example.com/portrait',
                            },
                          },
                        },
                        key: 'namespaces',
                        value: {
                          'org.iso.18013.5.1': {
                            given_name: 'Martin',
                            family_name: 'Auer',
                            portrait: 'https://example.com/portrait',
                          },
                        },
                      },
                      {
                        type: 'object',
                        origin: 'value',
                        input: {
                          'org.iso.18013.5.1': {
                            given_name: 'Martin',
                            family_name: 'Auer',
                            portrait: 'https://example.com/portrait',
                          },
                        },
                        key: 'org.iso.23220.1',
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
                    doctype: ['Invalid type: Expected "org.iso.23220.photoid.1" but received "org.iso.18013.5.1.mDL"'],
                    'namespaces.org.iso.23220.1': ['Invalid type: Expected Object but received undefined'],
                  },
                },
                input_credential_index: 0,
                claim_set_index: undefined,
              },
              {
                typed: false,
                success: false,
                output: {
                  credential_format: 'mso_mdoc',
                  doctype: 'org.iso.18013.5.1.mDL',
                  namespaces: {},
                },
                issues: [
                  {
                    kind: 'schema',
                    type: 'literal',
                    input: 'org.iso.18013.5.1.mDL',
                    expected: '"org.iso.23220.photoid.1"',
                    received: '"org.iso.18013.5.1.mDL"',
                    message: 'Invalid type: Expected "org.iso.23220.photoid.1" but received "org.iso.18013.5.1.mDL"',
                    requirement: undefined,
                    path: [
                      {
                        type: 'object',
                        origin: 'value',
                        input: {
                          credential_format: 'mso_mdoc',
                          doctype: 'org.iso.18013.5.1.mDL',
                          namespaces: {
                            'org.iso.18013.5.1': {
                              resident_country: 'Italy',
                              resident_address: 'Via Roma 1',
                              non_disclosed: 'secret',
                            },
                          },
                        },
                        key: 'doctype',
                        value: 'org.iso.18013.5.1.mDL',
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
                          doctype: 'org.iso.18013.5.1.mDL',
                          namespaces: {
                            'org.iso.18013.5.1': {
                              resident_country: 'Italy',
                              resident_address: 'Via Roma 1',
                              non_disclosed: 'secret',
                            },
                          },
                        },
                        key: 'namespaces',
                        value: {
                          'org.iso.18013.5.1': {
                            resident_country: 'Italy',
                            resident_address: 'Via Roma 1',
                            non_disclosed: 'secret',
                          },
                        },
                      },
                      {
                        type: 'object',
                        origin: 'value',
                        input: {
                          'org.iso.18013.5.1': {
                            resident_country: 'Italy',
                            resident_address: 'Via Roma 1',
                            non_disclosed: 'secret',
                          },
                        },
                        key: 'org.iso.23220.1',
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
                    doctype: ['Invalid type: Expected "org.iso.23220.photoid.1" but received "org.iso.18013.5.1.mDL"'],
                    'namespaces.org.iso.23220.1': ['Invalid type: Expected Object but received undefined'],
                  },
                },
                input_credential_index: 1,
                claim_set_index: undefined,
              },
              {
                typed: true,
                success: true,
                output: {
                  credential_format: 'mso_mdoc',
                  doctype: 'org.iso.23220.photoid.1',
                  namespaces: {
                    'org.iso.23220.1': {
                      given_name: 'Martin',
                      family_name: 'Auer',
                      portrait: 'https://example.com/portrait',
                    },
                  },
                },
                issues: undefined,
                input_credential_index: 2,
                claim_set_index: undefined,
              },
              {
                typed: false,
                success: false,
                output: {
                  credential_format: 'mso_mdoc',
                  doctype: 'org.iso.23220.photoid.1',
                  namespaces: {
                    'org.iso.23220.1': {},
                  },
                },
                issues: [
                  {
                    kind: 'schema',
                    type: 'non_nullish',
                    input: undefined,
                    expected: '(!null & !undefined)',
                    received: 'undefined',
                    message: 'Invalid type: Expected (!null & !undefined) but received undefined',
                    requirement: undefined,
                    path: [
                      {
                        type: 'object',
                        origin: 'value',
                        input: {
                          credential_format: 'mso_mdoc',
                          doctype: 'org.iso.23220.photoid.1',
                          namespaces: {
                            'org.iso.23220.1': {
                              resident_country: 'Italy',
                              resident_address: 'Via Roma 1',
                              non_disclosed: 'secret',
                            },
                          },
                        },
                        key: 'namespaces',
                        value: {
                          'org.iso.23220.1': {
                            resident_country: 'Italy',
                            resident_address: 'Via Roma 1',
                            non_disclosed: 'secret',
                          },
                        },
                      },
                      {
                        type: 'object',
                        origin: 'value',
                        input: {
                          'org.iso.23220.1': {
                            resident_country: 'Italy',
                            resident_address: 'Via Roma 1',
                            non_disclosed: 'secret',
                          },
                        },
                        key: 'org.iso.23220.1',
                        value: {
                          resident_country: 'Italy',
                          resident_address: 'Via Roma 1',
                          non_disclosed: 'secret',
                        },
                      },
                      {
                        type: 'object',
                        origin: 'value',
                        input: {
                          resident_country: 'Italy',
                          resident_address: 'Via Roma 1',
                          non_disclosed: 'secret',
                        },
                        key: 'given_name',
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
                    type: 'non_nullish',
                    input: undefined,
                    expected: '(!null & !undefined)',
                    received: 'undefined',
                    message: 'Invalid type: Expected (!null & !undefined) but received undefined',
                    requirement: undefined,
                    path: [
                      {
                        type: 'object',
                        origin: 'value',
                        input: {
                          credential_format: 'mso_mdoc',
                          doctype: 'org.iso.23220.photoid.1',
                          namespaces: {
                            'org.iso.23220.1': {
                              resident_country: 'Italy',
                              resident_address: 'Via Roma 1',
                              non_disclosed: 'secret',
                            },
                          },
                        },
                        key: 'namespaces',
                        value: {
                          'org.iso.23220.1': {
                            resident_country: 'Italy',
                            resident_address: 'Via Roma 1',
                            non_disclosed: 'secret',
                          },
                        },
                      },
                      {
                        type: 'object',
                        origin: 'value',
                        input: {
                          'org.iso.23220.1': {
                            resident_country: 'Italy',
                            resident_address: 'Via Roma 1',
                            non_disclosed: 'secret',
                          },
                        },
                        key: 'org.iso.23220.1',
                        value: {
                          resident_country: 'Italy',
                          resident_address: 'Via Roma 1',
                          non_disclosed: 'secret',
                        },
                      },
                      {
                        type: 'object',
                        origin: 'value',
                        input: {
                          resident_country: 'Italy',
                          resident_address: 'Via Roma 1',
                          non_disclosed: 'secret',
                        },
                        key: 'family_name',
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
                    type: 'non_nullish',
                    input: undefined,
                    expected: '(!null & !undefined)',
                    received: 'undefined',
                    message: 'Invalid type: Expected (!null & !undefined) but received undefined',
                    requirement: undefined,
                    path: [
                      {
                        type: 'object',
                        origin: 'value',
                        input: {
                          credential_format: 'mso_mdoc',
                          doctype: 'org.iso.23220.photoid.1',
                          namespaces: {
                            'org.iso.23220.1': {
                              resident_country: 'Italy',
                              resident_address: 'Via Roma 1',
                              non_disclosed: 'secret',
                            },
                          },
                        },
                        key: 'namespaces',
                        value: {
                          'org.iso.23220.1': {
                            resident_country: 'Italy',
                            resident_address: 'Via Roma 1',
                            non_disclosed: 'secret',
                          },
                        },
                      },
                      {
                        type: 'object',
                        origin: 'value',
                        input: {
                          'org.iso.23220.1': {
                            resident_country: 'Italy',
                            resident_address: 'Via Roma 1',
                            non_disclosed: 'secret',
                          },
                        },
                        key: 'org.iso.23220.1',
                        value: {
                          resident_country: 'Italy',
                          resident_address: 'Via Roma 1',
                          non_disclosed: 'secret',
                        },
                      },
                      {
                        type: 'object',
                        origin: 'value',
                        input: {
                          resident_country: 'Italy',
                          resident_address: 'Via Roma 1',
                          non_disclosed: 'secret',
                        },
                        key: 'portrait',
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
                    'namespaces.org.iso.23220.1.given_name': [
                      'Invalid type: Expected (!null & !undefined) but received undefined',
                    ],
                    'namespaces.org.iso.23220.1.family_name': [
                      'Invalid type: Expected (!null & !undefined) but received undefined',
                    ],
                    'namespaces.org.iso.23220.1.portrait': [
                      'Invalid type: Expected (!null & !undefined) but received undefined',
                    ],
                  },
                },
                input_credential_index: 3,
                claim_set_index: undefined,
              },
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
                    expected: '"org.iso.23220.photoid.1"',
                    received: '"example_doctype"',
                    message: 'Invalid type: Expected "org.iso.23220.photoid.1" but received "example_doctype"',
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
                        key: 'org.iso.23220.1',
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
                    doctype: ['Invalid type: Expected "org.iso.23220.photoid.1" but received "example_doctype"'],
                    'namespaces.org.iso.23220.1': ['Invalid type: Expected Object but received undefined'],
                  },
                },
                input_credential_index: 4,
                claim_set_index: undefined,
              },
              {
                typed: false,
                success: false,
                output: {
                  credential_format: 'vc+sd-jwt',
                },
                issues: [
                  {
                    kind: 'schema',
                    type: 'literal',
                    input: 'vc+sd-jwt',
                    expected: '"mso_mdoc"',
                    received: '"vc+sd-jwt"',
                    message: 'Invalid type: Expected "mso_mdoc" but received "vc+sd-jwt"',
                    requirement: undefined,
                    path: [
                      {
                        type: 'object',
                        origin: 'value',
                        input: {
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
                        },
                        key: 'credential_format',
                        value: 'vc+sd-jwt',
                      },
                    ],
                    issues: undefined,
                    lang: undefined,
                    abortEarly: undefined,
                    abortPipeEarly: undefined,
                  },
                  {
                    kind: 'schema',
                    type: 'literal',
                    input: undefined,
                    expected: '"org.iso.23220.photoid.1"',
                    received: 'undefined',
                    message: 'Invalid type: Expected "org.iso.23220.photoid.1" but received undefined',
                    requirement: undefined,
                    path: [
                      {
                        type: 'object',
                        origin: 'value',
                        input: {
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
                        },
                        key: 'doctype',
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
                        },
                        key: 'namespaces',
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
                    credential_format: ['Invalid type: Expected "mso_mdoc" but received "vc+sd-jwt"'],
                    doctype: ['Invalid type: Expected "org.iso.23220.photoid.1" but received undefined'],
                    namespaces: ['Invalid type: Expected Object but received undefined'],
                  },
                },
                input_credential_index: 5,
                claim_set_index: undefined,
              },
            ],
          ],
        },
        'photo_card-address': {
          typed: true,
          success: true,
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
          input_credential_index: 3,
          claim_set_index: undefined,
          all: [
            [
              {
                typed: false,
                success: false,
                output: {
                  credential_format: 'mso_mdoc',
                  doctype: 'org.iso.18013.5.1.mDL',
                  namespaces: {},
                },
                issues: [
                  {
                    kind: 'schema',
                    type: 'literal',
                    input: 'org.iso.18013.5.1.mDL',
                    expected: '"org.iso.23220.photoid.1"',
                    received: '"org.iso.18013.5.1.mDL"',
                    message: 'Invalid type: Expected "org.iso.23220.photoid.1" but received "org.iso.18013.5.1.mDL"',
                    requirement: undefined,
                    path: [
                      {
                        type: 'object',
                        origin: 'value',
                        input: {
                          credential_format: 'mso_mdoc',
                          doctype: 'org.iso.18013.5.1.mDL',
                          namespaces: {
                            'org.iso.18013.5.1': {
                              given_name: 'Martin',
                              family_name: 'Auer',
                              portrait: 'https://example.com/portrait',
                            },
                          },
                        },
                        key: 'doctype',
                        value: 'org.iso.18013.5.1.mDL',
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
                          doctype: 'org.iso.18013.5.1.mDL',
                          namespaces: {
                            'org.iso.18013.5.1': {
                              given_name: 'Martin',
                              family_name: 'Auer',
                              portrait: 'https://example.com/portrait',
                            },
                          },
                        },
                        key: 'namespaces',
                        value: {
                          'org.iso.18013.5.1': {
                            given_name: 'Martin',
                            family_name: 'Auer',
                            portrait: 'https://example.com/portrait',
                          },
                        },
                      },
                      {
                        type: 'object',
                        origin: 'value',
                        input: {
                          'org.iso.18013.5.1': {
                            given_name: 'Martin',
                            family_name: 'Auer',
                            portrait: 'https://example.com/portrait',
                          },
                        },
                        key: 'org.iso.23220.1',
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
                    doctype: ['Invalid type: Expected "org.iso.23220.photoid.1" but received "org.iso.18013.5.1.mDL"'],
                    'namespaces.org.iso.23220.1': ['Invalid type: Expected Object but received undefined'],
                  },
                },
                input_credential_index: 0,
                claim_set_index: undefined,
              },
              {
                typed: false,
                success: false,
                output: {
                  credential_format: 'mso_mdoc',
                  doctype: 'org.iso.18013.5.1.mDL',
                  namespaces: {},
                },
                issues: [
                  {
                    kind: 'schema',
                    type: 'literal',
                    input: 'org.iso.18013.5.1.mDL',
                    expected: '"org.iso.23220.photoid.1"',
                    received: '"org.iso.18013.5.1.mDL"',
                    message: 'Invalid type: Expected "org.iso.23220.photoid.1" but received "org.iso.18013.5.1.mDL"',
                    requirement: undefined,
                    path: [
                      {
                        type: 'object',
                        origin: 'value',
                        input: {
                          credential_format: 'mso_mdoc',
                          doctype: 'org.iso.18013.5.1.mDL',
                          namespaces: {
                            'org.iso.18013.5.1': {
                              resident_country: 'Italy',
                              resident_address: 'Via Roma 1',
                              non_disclosed: 'secret',
                            },
                          },
                        },
                        key: 'doctype',
                        value: 'org.iso.18013.5.1.mDL',
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
                          doctype: 'org.iso.18013.5.1.mDL',
                          namespaces: {
                            'org.iso.18013.5.1': {
                              resident_country: 'Italy',
                              resident_address: 'Via Roma 1',
                              non_disclosed: 'secret',
                            },
                          },
                        },
                        key: 'namespaces',
                        value: {
                          'org.iso.18013.5.1': {
                            resident_country: 'Italy',
                            resident_address: 'Via Roma 1',
                            non_disclosed: 'secret',
                          },
                        },
                      },
                      {
                        type: 'object',
                        origin: 'value',
                        input: {
                          'org.iso.18013.5.1': {
                            resident_country: 'Italy',
                            resident_address: 'Via Roma 1',
                            non_disclosed: 'secret',
                          },
                        },
                        key: 'org.iso.23220.1',
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
                    doctype: ['Invalid type: Expected "org.iso.23220.photoid.1" but received "org.iso.18013.5.1.mDL"'],
                    'namespaces.org.iso.23220.1': ['Invalid type: Expected Object but received undefined'],
                  },
                },
                input_credential_index: 1,
                claim_set_index: undefined,
              },
              {
                typed: false,
                success: false,
                output: {
                  credential_format: 'mso_mdoc',
                  doctype: 'org.iso.23220.photoid.1',
                  namespaces: {
                    'org.iso.23220.1': {},
                  },
                },
                issues: [
                  {
                    kind: 'schema',
                    type: 'non_nullish',
                    input: undefined,
                    expected: '(!null & !undefined)',
                    received: 'undefined',
                    message: 'Invalid type: Expected (!null & !undefined) but received undefined',
                    requirement: undefined,
                    path: [
                      {
                        type: 'object',
                        origin: 'value',
                        input: {
                          credential_format: 'mso_mdoc',
                          doctype: 'org.iso.23220.photoid.1',
                          namespaces: {
                            'org.iso.23220.1': {
                              given_name: 'Martin',
                              family_name: 'Auer',
                              portrait: 'https://example.com/portrait',
                            },
                          },
                        },
                        key: 'namespaces',
                        value: {
                          'org.iso.23220.1': {
                            given_name: 'Martin',
                            family_name: 'Auer',
                            portrait: 'https://example.com/portrait',
                          },
                        },
                      },
                      {
                        type: 'object',
                        origin: 'value',
                        input: {
                          'org.iso.23220.1': {
                            given_name: 'Martin',
                            family_name: 'Auer',
                            portrait: 'https://example.com/portrait',
                          },
                        },
                        key: 'org.iso.23220.1',
                        value: {
                          given_name: 'Martin',
                          family_name: 'Auer',
                          portrait: 'https://example.com/portrait',
                        },
                      },
                      {
                        type: 'object',
                        origin: 'value',
                        input: {
                          given_name: 'Martin',
                          family_name: 'Auer',
                          portrait: 'https://example.com/portrait',
                        },
                        key: 'resident_address',
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
                    type: 'non_nullish',
                    input: undefined,
                    expected: '(!null & !undefined)',
                    received: 'undefined',
                    message: 'Invalid type: Expected (!null & !undefined) but received undefined',
                    requirement: undefined,
                    path: [
                      {
                        type: 'object',
                        origin: 'value',
                        input: {
                          credential_format: 'mso_mdoc',
                          doctype: 'org.iso.23220.photoid.1',
                          namespaces: {
                            'org.iso.23220.1': {
                              given_name: 'Martin',
                              family_name: 'Auer',
                              portrait: 'https://example.com/portrait',
                            },
                          },
                        },
                        key: 'namespaces',
                        value: {
                          'org.iso.23220.1': {
                            given_name: 'Martin',
                            family_name: 'Auer',
                            portrait: 'https://example.com/portrait',
                          },
                        },
                      },
                      {
                        type: 'object',
                        origin: 'value',
                        input: {
                          'org.iso.23220.1': {
                            given_name: 'Martin',
                            family_name: 'Auer',
                            portrait: 'https://example.com/portrait',
                          },
                        },
                        key: 'org.iso.23220.1',
                        value: {
                          given_name: 'Martin',
                          family_name: 'Auer',
                          portrait: 'https://example.com/portrait',
                        },
                      },
                      {
                        type: 'object',
                        origin: 'value',
                        input: {
                          given_name: 'Martin',
                          family_name: 'Auer',
                          portrait: 'https://example.com/portrait',
                        },
                        key: 'resident_country',
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
                    'namespaces.org.iso.23220.1.resident_address': [
                      'Invalid type: Expected (!null & !undefined) but received undefined',
                    ],
                    'namespaces.org.iso.23220.1.resident_country': [
                      'Invalid type: Expected (!null & !undefined) but received undefined',
                    ],
                  },
                },
                input_credential_index: 2,
                claim_set_index: undefined,
              },
              {
                typed: true,
                success: true,
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
                issues: undefined,
                input_credential_index: 3,
                claim_set_index: undefined,
              },
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
                    expected: '"org.iso.23220.photoid.1"',
                    received: '"example_doctype"',
                    message: 'Invalid type: Expected "org.iso.23220.photoid.1" but received "example_doctype"',
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
                        key: 'org.iso.23220.1',
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
                    doctype: ['Invalid type: Expected "org.iso.23220.photoid.1" but received "example_doctype"'],
                    'namespaces.org.iso.23220.1': ['Invalid type: Expected Object but received undefined'],
                  },
                },
                input_credential_index: 4,
                claim_set_index: undefined,
              },
              {
                typed: false,
                success: false,
                output: {
                  credential_format: 'vc+sd-jwt',
                },
                issues: [
                  {
                    kind: 'schema',
                    type: 'literal',
                    input: 'vc+sd-jwt',
                    expected: '"mso_mdoc"',
                    received: '"vc+sd-jwt"',
                    message: 'Invalid type: Expected "mso_mdoc" but received "vc+sd-jwt"',
                    requirement: undefined,
                    path: [
                      {
                        type: 'object',
                        origin: 'value',
                        input: {
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
                        },
                        key: 'credential_format',
                        value: 'vc+sd-jwt',
                      },
                    ],
                    issues: undefined,
                    lang: undefined,
                    abortEarly: undefined,
                    abortPipeEarly: undefined,
                  },
                  {
                    kind: 'schema',
                    type: 'literal',
                    input: undefined,
                    expected: '"org.iso.23220.photoid.1"',
                    received: 'undefined',
                    message: 'Invalid type: Expected "org.iso.23220.photoid.1" but received undefined',
                    requirement: undefined,
                    path: [
                      {
                        type: 'object',
                        origin: 'value',
                        input: {
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
                        },
                        key: 'doctype',
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
                        },
                        key: 'namespaces',
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
                    credential_format: ['Invalid type: Expected "mso_mdoc" but received "vc+sd-jwt"'],
                    doctype: ['Invalid type: Expected "org.iso.23220.photoid.1" but received undefined'],
                    namespaces: ['Invalid type: Expected Object but received undefined'],
                  },
                },
                input_credential_index: 5,
                claim_set_index: undefined,
              },
            ],
          ],
        },
      },
    })

    const presentationQueryResult = DcqlPresentationResult.fromDcqlPresentation(
      {
        'mdl-id': res.credential_matches['mdl-id'].output,
        'mdl-address': res.credential_matches['mdl-address'].output,
        'photo_card-address': res.credential_matches['photo_card-address'].output,
        'photo_card-id': res.credential_matches['photo_card-id'].output,
        // biome-ignore lint/suspicious/noExplicitAny: <explanation>
      } as any,
      { dcqlQuery: query }
    )

    assert.deepStrictEqual(presentationQueryResult, {
      credentials: [
        {
          id: 'mdl-id',
          format: 'mso_mdoc',
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
          claims: [
            {
              id: 'resident_address',
              namespace: 'org.iso.18013.5.1',
              claim_name: 'resident_address',
            },
            {
              id: 'resident_country',
              namespace: 'org.iso.18013.5.1',
              claim_name: 'resident_country',
            },
          ],
          meta: {
            doctype_value: 'org.iso.18013.5.1.mDL',
          },
        },
        {
          id: 'photo_card-id',
          format: 'mso_mdoc',
          claims: [
            {
              id: 'given_name',
              namespace: 'org.iso.23220.1',
              claim_name: 'given_name',
            },
            {
              id: 'family_name',
              namespace: 'org.iso.23220.1',
              claim_name: 'family_name',
            },
            {
              id: 'portrait',
              namespace: 'org.iso.23220.1',
              claim_name: 'portrait',
            },
          ],
          meta: {
            doctype_value: 'org.iso.23220.photoid.1',
          },
        },
        {
          id: 'photo_card-address',
          format: 'mso_mdoc',
          claims: [
            {
              id: 'resident_address',
              namespace: 'org.iso.23220.1',
              claim_name: 'resident_address',
            },
            {
              id: 'resident_country',
              namespace: 'org.iso.23220.1',
              claim_name: 'resident_country',
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
