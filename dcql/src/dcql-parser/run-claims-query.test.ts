import { describe, expect, it } from 'vitest'
import { runClaimsQuery } from './dcql-claims-query-result.js'

const namespacesExample = {
  'org.iso.18013.5.1': {
    given_name: 'Arthur',
    family_name: 'Dent',
    driving_privileges: [
      {
        name: 'something',
      },
    ],
  },
}

const claimsExample = {
  name: 'Arthur Dent',
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
      university: 'University of Katala',
    },
  ],
  nationalities: ['British', 'Betelgeusian'],
}

describe('Run Claims Query', () => {
  it('mso_mdoc without claims and claim sets', () => {
    const result = runClaimsQuery(
      { format: 'mso_mdoc', id: 'mso_mdoc', multiple: false },
      {
        credential: {
          credential_format: 'mso_mdoc',
          namespaces: namespacesExample,
          doctype: 'org.iso.18013.5.1',
        },
        presentation: false,
      }
    )

    expect(result).toStrictEqual({
      success: true,
      valid_claims: [],
      failed_claims: [],
      valid_claim_sets: [
        {
          claim_set_index: undefined,
          output: {},
          success: true,
          valid_claim_indexes: [],
        },
      ],
      failed_claim_sets: [],
    })
  })

  it('mso_mdoc with valid claims and without claim sets', () => {
    const result = runClaimsQuery(
      {
        format: 'mso_mdoc',
        id: 'mso_mdoc',
        multiple: false,
        claims: [
          {
            path: ['org.iso.18013.5.1', 'given_name'],
          },
          {
            path: ['org.iso.18013.5.1', 'family_name'],
            values: ['Dent'],
          },
        ],
      },
      {
        credential: {
          credential_format: 'mso_mdoc',
          namespaces: namespacesExample,
          doctype: 'org.iso.18013.5.1.mDL',
        },
        presentation: false,
      }
    )

    expect(result).toStrictEqual({
      success: true,
      failed_claim_sets: [],
      valid_claim_sets: [
        {
          success: true,
          output: {
            'org.iso.18013.5.1': { given_name: 'Arthur', family_name: 'Dent' },
          },
          valid_claim_indexes: [0, 1],
          claim_set_index: undefined,
        },
      ],
      valid_claims: [
        {
          success: true,
          claim_id: undefined,
          claim_index: 0,
          output: { 'org.iso.18013.5.1': { given_name: 'Arthur' } },
        },
        {
          success: true,
          claim_id: undefined,
          claim_index: 1,
          output: { 'org.iso.18013.5.1': { family_name: 'Dent' } },
        },
      ],
      failed_claims: [],
    })
  })

  it('mso_mdoc with valid/failed claims and without claim sets', () => {
    const result = runClaimsQuery(
      {
        format: 'mso_mdoc',
        id: 'mso_mdoc',
        multiple: false,
        claims: [
          {
            path: ['org.iso.18013.5.1', 'given_name'],
          },
          {
            path: ['org.iso.18013.5.1', 'family_name'],
            values: ['Shakira'],
          },
        ],
      },
      {
        credential: {
          credential_format: 'mso_mdoc',
          namespaces: namespacesExample,
          doctype: 'org.iso.18013.5.1.mDL',
        },
        presentation: false,
      }
    )

    expect(result).toStrictEqual({
      success: false,
      failed_claim_sets: [
        {
          success: false,
          claim_set_index: undefined,
          output: {
            'org.iso.18013.5.1': {
              given_name: 'Arthur',
              family_name: 'Dent',
              driving_privileges: [
                {
                  name: 'something',
                },
              ],
            },
          },
          issues: expect.any(Array),
          flattened: {
            nested: {
              'org.iso.18013.5.1.family_name': ['Invalid type: Expected "Shakira" but received "Dent"'],
            },
          },
          valid_claim_indexes: [0],
          failed_claim_indexes: [1],
        },
      ],
      valid_claims: [
        {
          success: true,
          claim_index: 0,
          claim_id: undefined,
          output: { 'org.iso.18013.5.1': { given_name: 'Arthur' } },
        },
      ],
      failed_claims: [
        {
          success: false,
          claim_index: 1,
          claim_id: undefined,
          output: { 'org.iso.18013.5.1': { family_name: 'Dent' } },
          issues: expect.any(Array),
          flattened: {
            nested: {
              'org.iso.18013.5.1.family_name': ['Invalid type: Expected "Shakira" but received "Dent"'],
            },
          },
        },
      ],
    })
  })

  it('dc+sd-jwt without claims and claim sets', () => {
    const result = runClaimsQuery(
      { format: 'dc+sd-jwt', id: 'dc-sd-jwt', multiple: false },
      {
        credential: {
          credential_format: 'dc+sd-jwt',
          claims: claimsExample,
          vct: 'SdJwtVc',
        },
        presentation: false,
      }
    )

    expect(result).toStrictEqual({
      success: true,
      valid_claims: [],
      failed_claims: [],
      valid_claim_sets: [
        {
          claim_set_index: undefined,
          output: {},
          success: true,
          valid_claim_indexes: [],
        },
      ],
      failed_claim_sets: [],
    })
  })

  it('dc+sd-jwt with valid claims and without claim sets', () => {
    const result = runClaimsQuery(
      {
        format: 'dc+sd-jwt',
        id: 'dc-sd-jwt',
        multiple: false,
        claims: [
          {
            path: ['name'],
          },
          {
            path: ['address', 'street_address'],
            values: ['42 Market Street'],
          },
          {
            path: ['degrees', 1, 'type'],
          },
          {
            path: ['degrees', null, 'university'],
            values: ['University of Betelgeuse'],
          },
          {
            path: ['degrees', null],
          },
        ],
      },
      {
        credential: {
          credential_format: 'dc+sd-jwt',
          claims: claimsExample,
          vct: 'SdJwtVc',
        },
        presentation: false,
      }
    )
    console.log(JSON.stringify(result, null, 2))

    // expect(result).toStrictEqual({
    //   success: false,
    //   failed_claim_sets: [
    //     {
    //       success: false,
    //       failed_claim_indexes: [3],
    //       valid_claim_indexes: [0, 1, 2, 4],
    //       flattened: {
    //         nested: {
    //           'degrees.1.university': [
    //             'Invalid type: Expected "University of Betelgeuse" but received "University of Katala"',
    //           ],
    //         },
    //       },
    //       issues: [
    //         {
    //           kind: 'transformation',
    //           type: 'raw_transform',
    //           input: 'University of Katala',
    //           expected: '"University of Betelgeuse"',
    //           received: '"University of Katala"',
    //           message: 'Invalid type: Expected "University of Betelgeuse" but received "University of Katala"',
    //           path: [
    //             {
    //               type: 'object',
    //               origin: 'value',
    //               input: {
    //                 name: 'Arthur Dent',
    //                 address: { street_address: '42 Market Street', locality: 'Milliways', postal_code: '12345' },
    //                 degrees: [
    //                   { type: 'Bachelor of Science', university: 'University of Betelgeuse' },
    //                   { type: 'Master of Science', university: 'University of Katala' },
    //                 ],
    //                 nationalities: ['British', 'Betelgeusian'],
    //               },
    //               key: 'degrees',
    //               value: [
    //                 { type: 'Bachelor of Science', university: 'University of Betelgeuse' },
    //                 { type: 'Master of Science', university: 'University of Katala' },
    //               ],
    //             },
    //             {
    //               type: 'array',
    //               origin: 'value',
    //               input: [
    //                 { type: 'Bachelor of Science', university: 'University of Betelgeuse' },
    //                 { type: 'Master of Science', university: 'University of Katala' },
    //               ],
    //               key: 1,
    //               value: { type: 'Master of Science', university: 'University of Katala' },
    //             },
    //             {
    //               type: 'object',
    //               origin: 'value',
    //               input: { type: 'Master of Science', university: 'University of Katala' },
    //               key: 'university',
    //               value: 'University of Katala',
    //             },
    //           ],
    //         },
    //       ],
    //       output: {
    //         name: 'Arthur Dent',
    //         address: { street_address: '42 Market Street', locality: 'Milliways', postal_code: '12345' },
    //         degrees: [
    //           { type: 'Bachelor of Science', university: 'University of Betelgeuse' },
    //           { type: 'Master of Science', university: 'University of Katala' },
    //         ],
    //         nationalities: ['British', 'Betelgeusian'],
    //       },
    //     },
    //   ],
    //   failed_claims: [
    //     {
    //       success: false,
    //       issues: [
    //         {
    //           kind: 'transformation',
    //           type: 'raw_transform',
    //           input: 'University of Katala',
    //           expected: '"University of Betelgeuse"',
    //           received: '"University of Katala"',
    //           message: 'Invalid type: Expected "University of Betelgeuse" but received "University of Katala"',
    //           path: [
    //             {
    //               type: 'object',
    //               origin: 'value',
    //               input: {
    //                 name: 'Arthur Dent',
    //                 address: { street_address: '42 Market Street', locality: 'Milliways', postal_code: '12345' },
    //                 degrees: [
    //                   { type: 'Bachelor of Science', university: 'University of Betelgeuse' },
    //                   { type: 'Master of Science', university: 'University of Katala' },
    //                 ],
    //                 nationalities: ['British', 'Betelgeusian'],
    //               },
    //               key: 'degrees',
    //               value: [
    //                 { type: 'Bachelor of Science', university: 'University of Betelgeuse' },
    //                 { type: 'Master of Science', university: 'University of Katala' },
    //               ],
    //             },
    //             {
    //               type: 'array',
    //               origin: 'value',
    //               input: [
    //                 { type: 'Bachelor of Science', university: 'University of Betelgeuse' },
    //                 { type: 'Master of Science', university: 'University of Katala' },
    //               ],
    //               key: 1,
    //               value: { type: 'Master of Science', university: 'University of Katala' },
    //             },
    //             {
    //               type: 'object',
    //               origin: 'value',
    //               input: { type: 'Master of Science', university: 'University of Katala' },
    //               key: 'university',
    //               value: 'University of Katala',
    //             },
    //           ],
    //         },
    //       ],
    //       flattened: {
    //         nested: {
    //           'degrees.1.university': [
    //             'Invalid type: Expected "University of Betelgeuse" but received "University of Katala"',
    //           ],
    //         },
    //       },
    //       claim_index: 3,
    //       output: { degrees: [{ university: 'University of Betelgeuse' }, { university: 'University of Katala' }] },
    //     },
    //   ],
    //   valid_claims: [
    //     { success: true, claim_index: 0, output: { name: 'Arthur Dent' } },
    //     { success: true, claim_index: 1, output: { address: { street_address: '42 Market Street' } } },
    //     { success: true, claim_index: 2, output: { degrees: { type: 'Master of Science' } } },
    //     {
    //       success: true,
    //       claim_index: 4,
    //       output: {
    //         degrees: [
    //           { type: 'Bachelor of Science', university: 'University of Betelgeuse' },
    //           { type: 'Master of Science', university: 'University of Katala' },
    //         ],
    //       },
    //     },
    //   ],
    // })
  })
})
