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
      { format: 'mso_mdoc', id: 'mso_mdoc', multiple: false, require_cryptographic_holder_binding: true },
      {
        credential: {
          credential_format: 'mso_mdoc',
          namespaces: namespacesExample,
          doctype: 'org.iso.18013.5.1',
          cryptographic_holder_binding: true,
        },
        presentation: false,
      }
    )

    expect(result).toStrictEqual({
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
    })
  })

  it('mso_mdoc with valid claims and without claim sets', () => {
    const result = runClaimsQuery(
      {
        format: 'mso_mdoc',
        require_cryptographic_holder_binding: true,
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
          cryptographic_holder_binding: true,
          credential_format: 'mso_mdoc',
          namespaces: namespacesExample,
          doctype: 'org.iso.18013.5.1.mDL',
        },
        presentation: false,
      }
    )

    expect(result).toStrictEqual({
      success: true,
      failed_claim_sets: undefined,
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
      failed_claims: undefined,
    })
  })

  it('mso_mdoc with valid/failed claims and without claim sets', () => {
    const result = runClaimsQuery(
      {
        format: 'mso_mdoc',
        id: 'mso_mdoc',
        multiple: false,
        require_cryptographic_holder_binding: true,
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
          cryptographic_holder_binding: true,
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
          issues: {
            'org.iso.18013.5.1.family_name': [
              "Expected claim 'org.iso.18013.5.1'.'family_name' to be 'Shakira' but received 'Dent'",
            ],
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
          output: {
            'org.iso.18013.5.1': {
              family_name: 'Dent',
            },
          },
          issues: {
            'org.iso.18013.5.1.family_name': [
              "Expected claim 'org.iso.18013.5.1'.'family_name' to be 'Shakira' but received 'Dent'",
            ],
          },
        },
      ],
    })
  })

  it('dc+sd-jwt without claims and claim sets', () => {
    const result = runClaimsQuery(
      { format: 'dc+sd-jwt', id: 'dc-sd-jwt', multiple: false, require_cryptographic_holder_binding: true },
      {
        credential: {
          cryptographic_holder_binding: true,
          credential_format: 'dc+sd-jwt',
          claims: claimsExample,
          vct: 'SdJwtVc',
        },
        presentation: false,
      }
    )

    expect(result).toStrictEqual({
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
    })
  })

  it('dc+sd-jwt with valid claims and without claim sets', () => {
    const result = runClaimsQuery(
      {
        format: 'dc+sd-jwt',
        require_cryptographic_holder_binding: true,
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
          cryptographic_holder_binding: true,
          claims: claimsExample,
          vct: 'SdJwtVc',
        },
        presentation: false,
      }
    )

    expect(result).toStrictEqual({
      success: true,
      failed_claim_sets: undefined,
      valid_claim_sets: [
        {
          success: true,
          claim_set_index: undefined,
          output: {
            name: 'Arthur Dent',
            address: {
              street_address: '42 Market Street',
            },
            degrees: [
              {
                university: 'University of Betelgeuse',
                type: 'Bachelor of Science',
              },
              {
                type: 'Master of Science',
                university: 'University of Katala',
              },
            ],
          },
          valid_claim_indexes: [0, 1, 2, 3, 4],
        },
      ],
      valid_claims: [
        {
          success: true,
          claim_index: 0,
          claim_id: undefined,
          output: {
            name: 'Arthur Dent',
          },
        },
        {
          success: true,
          claim_index: 1,
          claim_id: undefined,
          output: {
            address: {
              street_address: '42 Market Street',
            },
          },
        },
        {
          success: true,
          claim_index: 2,
          claim_id: undefined,
          output: {
            degrees: [
              null,
              {
                type: 'Master of Science',
              },
            ],
          },
        },
        {
          success: true,
          claim_index: 3,
          claim_id: undefined,
          output: {
            degrees: [
              {
                university: 'University of Betelgeuse',
              },
              null,
            ],
          },
        },
        {
          success: true,
          claim_index: 4,
          claim_id: undefined,
          output: {
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
          },
        },
      ],
      failed_claims: undefined,
    })
  })

  it('dc+sd-jwt with invalid nested claims for first claim set', () => {
    const result = runClaimsQuery(
      {
        format: 'dc+sd-jwt',
        id: 'dc-sd-jwt',
        multiple: false,
        claims: [
          {
            id: '0',
            path: ['name'],
          },
          {
            id: '1',
            path: ['address', 'street_address'],
            values: ['42 Market Street'],
          },
          {
            id: '2',
            path: ['degrees', 1, 'type'],
            values: ['RandomType'],
          },
          {
            id: '3',
            path: ['degrees', null, 'university'],
            values: ['University of Betelgeuse'],
          },
          {
            id: '4',
            path: ['degrees', null],
          },
        ],
        require_cryptographic_holder_binding: true,
        claim_sets: [
          ['0', '1', '2', '3', '4'],
          ['0', '1', '3', '4'],
        ],
      },
      {
        credential: {
          cryptographic_holder_binding: true,
          credential_format: 'dc+sd-jwt',
          claims: claimsExample,
          vct: 'SdJwtVc',
        },
        presentation: false,
      }
    )

    expect(result).toStrictEqual({
      success: true,
      failed_claim_sets: [
        {
          success: false,
          claim_set_index: 0,
          issues: {
            'degrees.type': ["Expected claim 'degrees'.1.'type' to be 'RandomType' but received 'Master of Science'"],
          },
          valid_claim_indexes: [0, 1, 3, 4],
          failed_claim_indexes: [2],
        },
      ],
      valid_claim_sets: [
        {
          success: true,
          claim_set_index: 1,
          output: {
            name: 'Arthur Dent',
            address: {
              street_address: '42 Market Street',
            },
            degrees: [
              {
                university: 'University of Betelgeuse',
                type: 'Bachelor of Science',
              },
              {
                type: 'Master of Science',
                university: 'University of Katala',
              },
            ],
          },
          valid_claim_indexes: [0, 1, 3, 4],
        },
      ],
      valid_claims: [
        {
          success: true,
          claim_index: 0,
          claim_id: '0',
          output: {
            name: 'Arthur Dent',
          },
        },
        {
          success: true,
          claim_index: 1,
          claim_id: '1',
          output: {
            address: {
              street_address: '42 Market Street',
            },
          },
        },
        {
          success: true,
          claim_index: 3,
          claim_id: '3',
          output: {
            degrees: [
              {
                university: 'University of Betelgeuse',
              },
              null,
            ],
          },
        },
        {
          success: true,
          claim_index: 4,
          claim_id: '4',
          output: {
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
          },
        },
      ],
      failed_claims: [
        {
          success: false,
          claim_index: 2,
          claim_id: '2',
          issues: {
            'degrees.type': ["Expected claim 'degrees'.1.'type' to be 'RandomType' but received 'Master of Science'"],
          },
          output: {
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
          },
        },
      ],
    })
  })
})
