import assert from 'node:assert'
import { describe, expect, it } from 'vitest'
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
  cryptographic_holder_binding: true,
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
  cryptographic_holder_binding: true,
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
  cryptographic_holder_binding: true,
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
  cryptographic_holder_binding: true,
} satisfies DcqlMdocCredential

const mdocExample = {
  credential_format: 'mso_mdoc',
  doctype: 'example_doctype',
  namespaces: {
    example_namespaces: {
      example_claim: 'example_value',
    },
  },
  cryptographic_holder_binding: true,
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
  cryptographic_holder_binding: true,
} satisfies DcqlSdJwtVcCredential

describe('complex-mdoc-query', () => {
  it('fails with no credentials', (_t) => {
    const query = DcqlQuery.parse(complexMdocQuery)
    DcqlQuery.validate(query)

    expect(DcqlQuery.query(query, [])).toMatchObject({
      can_be_satisfied: false,
      credential_matches: {
        'mdl-address': {
          credential_query_id: 'mdl-address',
          failed_credentials: undefined,
          success: false,
          valid_credentials: undefined,
        },
        'mdl-id': {
          credential_query_id: 'mdl-id',
          failed_credentials: undefined,
          success: false,
          valid_credentials: undefined,
        },
        'photo_card-address': {
          credential_query_id: 'photo_card-address',
          failed_credentials: undefined,
          success: false,
          valid_credentials: undefined,
        },
        'photo_card-id': {
          credential_query_id: 'photo_card-id',
          failed_credentials: undefined,
          success: false,
          valid_credentials: undefined,
        },
      },
    })
  })

  it('fails with credentials that do not satisfy a required claim_set', (_t) => {
    const query = DcqlQuery.parse(complexMdocQuery)
    DcqlQuery.validate(query)

    const res = DcqlQuery.query(query, [mdocMdlAddress, mdocPhotoCardAddress])
    assert(!res.can_be_satisfied)
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
      credentials: complexMdocQuery.credentials.map((c) => ({
        ...c,
        multiple: false,
        require_cryptographic_holder_binding: true,
      })),
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
      can_be_satisfied: true,
      credential_matches: res.credential_matches,
    } as const)

    const presentationQueryResult = DcqlPresentationResult.fromDcqlPresentation(
      {
        'mdl-id': [
          {
            namespaces: res.credential_matches['mdl-id'].valid_credentials?.[0].claims.valid_claim_sets[0].output,
            ...res.credential_matches['mdl-id'].valid_credentials?.[0].meta.output,
          },
        ],
        'mdl-address': [
          {
            namespaces: res.credential_matches['mdl-address'].valid_credentials?.[0].claims.valid_claim_sets[0].output,
            ...res.credential_matches['mdl-address'].valid_credentials?.[0].meta.output,
          },
        ],
        'photo_card-address': [
          {
            namespaces:
              res.credential_matches['photo_card-address'].valid_credentials?.[0].claims.valid_claim_sets[0].output,
            ...res.credential_matches['photo_card-address'].valid_credentials?.[0].meta.output,
          },
        ],
        'photo_card-id': [
          {
            namespaces:
              res.credential_matches['photo_card-id'].valid_credentials?.[0].claims.valid_claim_sets[0].output,
            ...res.credential_matches['photo_card-id'].valid_credentials?.[0].meta.output,
          },
        ],
        // biome-ignore lint/suspicious/noExplicitAny: <explanation>
      } as any,
      { dcqlQuery: query }
    )

    assert(presentationQueryResult.can_be_satisfied)
    assert.deepStrictEqual(presentationQueryResult.credential_sets, [
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
    ])
  })
})
