import { describe, expect, test } from 'vitest'
import { DcqlQuery } from '../dcql-query'
import { DcqlPresentationResult } from './m-dcql-presentation-result'

describe('DCQL presentation with claim sets', () => {
  test('Correctly handles a presentation with one credential but the query requested two', () => {
    const dcqlQuery: DcqlQuery.Input = {
      credentials: [
        {
          id: 'c5d24076-71b1-4eb8-b3b2-1853a9f7e6b5',
          format: 'vc+sd-jwt',
          claims: [{ path: ['given_name'] }, { path: ['family_name'] }],
          meta: {
            vct_values: ['PersonIdentificationData'],
          },
        },
        {
          id: 'a50b7f9f-b5b1-4845-a7d3-3eb4830fdedc',
          format: 'vc+sd-jwt',
          claims: [{ path: ['expiry_date'] }, { path: ['document_number'] }],
          meta: {
            vct_values: ['MDL'],
          },
        },
      ],
    }

    const dcqlPresentation = {
      'c5d24076-71b1-4eb8-b3b2-1853a9f7e6b5': {
        claims: {
          given_name: { foo: {} },
          family_name: { bar: {} },
        },
        includes_cryptographic_holder_binding: true,
        credential_format: 'vc+sd-jwt',
        vct: 'PersonIdentificationData',
      },
    } as const

    const parsedQuery = DcqlQuery.parse(dcqlQuery)
    DcqlQuery.validate(parsedQuery)

    const presentationQueryResult = DcqlPresentationResult.fromDcqlPresentation(dcqlPresentation, {
      dcqlQuery: parsedQuery,
    })

    expect(presentationQueryResult.canBeSatisfied).toEqual(false)
  })

  test('Correctly handles a presentation with multiple claim sets where the first claim set matches', () => {
    const query: DcqlQuery.Input = {
      credentials: [
        {
          id: '8c791a1f-12b4-41fe-a892-236c2887fa8e',
          format: 'vc+sd-jwt',
          meta: { vct_values: ['PersonIdentificationData'] },
          claims: [
            { id: 'a', path: ['given_name'] },
            { id: 'b', path: ['family_name'] },
            { id: 'c', path: ['tax_id_code'] },
          ],
          claim_sets: [['c'], ['a', 'b']],
        },
      ],
    }

    const dcqlPresentation = {
      '8c791a1f-12b4-41fe-a892-236c2887fa8e': {
        credential_format: 'vc+sd-jwt',
        vct: 'PersonIdentificationData',
        includes_cryptographic_holder_binding: true,
        claims: {
          tax_id_code: { baz: {} },
        },
      },
    } as const

    const parsedQuery = DcqlQuery.parse(query)
    DcqlQuery.validate(parsedQuery)

    const presentationQueryResult = DcqlPresentationResult.fromDcqlPresentation(dcqlPresentation, {
      dcqlQuery: parsedQuery,
    })

    expect(presentationQueryResult).toEqual({
      canBeSatisfied: true,
      credentials: parsedQuery.credentials,
      credential_sets: undefined,
      invalid_matches: undefined,
      valid_matches: {
        '8c791a1f-12b4-41fe-a892-236c2887fa8e': {
          claim_set_index: 0,
          presentation_id: '8c791a1f-12b4-41fe-a892-236c2887fa8e',
          success: true,
          typed: true,
          output: {
            claims: {
              tax_id_code: {
                baz: {},
              },
            },
            credential_format: 'vc+sd-jwt',
            vct: 'PersonIdentificationData',
            includes_cryptographic_holder_binding: true,
          },
        },
      },
    })
  })

  test('Correctly handles a presentation with multiple claim sets where the second claim set matches', () => {
    const query: DcqlQuery.Input = {
      credentials: [
        {
          id: '8c791a1f-12b4-41fe-a892-236c2887fa8e',
          format: 'vc+sd-jwt',
          meta: { vct_values: ['PersonIdentificationData'] },
          claims: [
            { id: 'a', path: ['given_name'] },
            { id: 'b', path: ['family_name'] },
            { id: 'c', path: ['tax_id_code'] },
          ],
          claim_sets: [['c'], ['a', 'b']],
        },
      ],
    }

    const dcqlPresentation = {
      '8c791a1f-12b4-41fe-a892-236c2887fa8e': {
        credential_format: 'vc+sd-jwt',
        vct: 'PersonIdentificationData',
        includes_cryptographic_holder_binding: true,
        claims: {
          given_name: { foo: {} },
          family_name: { bar: {} },
        },
      },
    } as const

    const parsedQuery = DcqlQuery.parse(query)
    DcqlQuery.validate(parsedQuery)

    const presentationQueryResult = DcqlPresentationResult.fromDcqlPresentation(dcqlPresentation, {
      dcqlQuery: parsedQuery,
    })

    expect(presentationQueryResult).toEqual({
      canBeSatisfied: true,
      credentials: parsedQuery.credentials,
      credential_sets: undefined,
      valid_matches: {
        '8c791a1f-12b4-41fe-a892-236c2887fa8e': {
          claim_set_index: 1,
          presentation_id: '8c791a1f-12b4-41fe-a892-236c2887fa8e',
          success: true,
          typed: true,
          output: {
            claims: {
              given_name: { foo: {} },
              family_name: { bar: {} },
            },
            credential_format: 'vc+sd-jwt',
            includes_cryptographic_holder_binding: true,
            vct: 'PersonIdentificationData',
          },
        },
      },
      invalid_matches: undefined,
    })
  })

  test('Correctly handles a presentation with a credential set and multiple claim sets where the first credential set and second claim set matches', () => {
    const query: DcqlQuery.Input = {
      credentials: [
        {
          id: '8c791a1f-12b4-41fe-a892-236c2887fa8e',
          format: 'vc+sd-jwt',
          meta: { vct_values: ['PersonIdentificationData'] },
          claims: [
            { id: 'a', path: ['given_name'] },
            { id: 'b', path: ['family_name'] },
            { id: 'c', path: ['tax_id_code'] },
          ],
          claim_sets: [['c'], ['a', 'b']],
        },
      ],
      credential_sets: [
        {
          options: [['8c791a1f-12b4-41fe-a892-236c2887fa8e']],
          required: true,
        },
      ],
    }

    const dcqlPresentation = {
      '8c791a1f-12b4-41fe-a892-236c2887fa8e': {
        credential_format: 'vc+sd-jwt',
        vct: 'PersonIdentificationData',
        includes_cryptographic_holder_binding: true,
        claims: {
          given_name: { foo: {} },
          family_name: { bar: {} },
        },
      },
    } as const

    const parsedQuery = DcqlQuery.parse(query)
    DcqlQuery.validate(parsedQuery)

    const presentationQueryResult = DcqlPresentationResult.fromDcqlPresentation(dcqlPresentation, {
      dcqlQuery: parsedQuery,
    })

    expect(presentationQueryResult).toEqual({
      canBeSatisfied: true,
      credentials: parsedQuery.credentials,
      credential_sets: [
        {
          matching_options: [['8c791a1f-12b4-41fe-a892-236c2887fa8e']],
          options: [['8c791a1f-12b4-41fe-a892-236c2887fa8e']],
          required: true,
        },
      ],
      valid_matches: {
        '8c791a1f-12b4-41fe-a892-236c2887fa8e': {
          claim_set_index: 1,
          presentation_id: '8c791a1f-12b4-41fe-a892-236c2887fa8e',
          success: true,
          typed: true,
          output: {
            claims: {
              given_name: { foo: {} },
              family_name: { bar: {} },
            },
            credential_format: 'vc+sd-jwt',
            includes_cryptographic_holder_binding: true,
            vct: 'PersonIdentificationData',
          },
        },
      },
      invalid_matches: undefined,
    })
  })

  test('Correctly handles a presentation without cryptographic binding but required in query', () => {
    const query: DcqlQuery.Input = {
      credentials: [
        {
          id: '8c791a1f-12b4-41fe-a892-236c2887fa8e',
          format: 'vc+sd-jwt',
          meta: { vct_values: ['PersonIdentificationData'] },
          claims: [{ path: ['given_name'] }],
        },
        {
          id: '5ff30b81-fd6b-4133-97c9-0c4520789e84',
          format: 'mso_mdoc',
          meta: { doctype_value: 'PersonIdentificationData' },
          claims: [{ path: ['namespace', 'given_name'] }],
          require_cryptographic_holder_binding: true,
        },
      ],
    }

    const dcqlPresentation = {
      '8c791a1f-12b4-41fe-a892-236c2887fa8e': {
        credential_format: 'vc+sd-jwt',
        vct: 'PersonIdentificationData',
        includes_cryptographic_holder_binding: false,
        claims: {
          given_name: { foo: {} },
          family_name: { bar: {} },
        },
      },
      '5ff30b81-fd6b-4133-97c9-0c4520789e84': {
        credential_format: 'mso_mdoc',
        doctype: 'PersonIdentificationData',
        includes_cryptographic_holder_binding: false,
        namespaces: {
          namespace: {
            given_name: 'foo',
            family_name: 'bar',
          },
        },
      },
    } as const

    const parsedQuery = DcqlQuery.parse(query)
    DcqlQuery.validate(parsedQuery)

    const presentationQueryResult = DcqlPresentationResult.fromDcqlPresentation(dcqlPresentation, {
      dcqlQuery: parsedQuery,
    })

    expect(presentationQueryResult).toEqual({
      canBeSatisfied: false,
      credentials: parsedQuery.credentials,
      credential_sets: undefined,
      invalid_matches: {
        '8c791a1f-12b4-41fe-a892-236c2887fa8e': {
          claim_set_index: undefined,
          presentation_id: '8c791a1f-12b4-41fe-a892-236c2887fa8e',
          success: false,
          typed: false,
          flattened: {
            nested: {
              includes_cryptographic_holder_binding: [
                "Credential query '8c791a1f-12b4-41fe-a892-236c2887fa8e' requires cryptographic holder binding",
              ],
            },
          },
          issues: expect.any(Array),
          output: {
            claims: {
              given_name: { foo: {} },
            },
            includes_cryptographic_holder_binding: false,
            credential_format: 'vc+sd-jwt',
            vct: 'PersonIdentificationData',
          },
        },
        '5ff30b81-fd6b-4133-97c9-0c4520789e84': {
          claim_set_index: undefined,
          presentation_id: '5ff30b81-fd6b-4133-97c9-0c4520789e84',
          success: false,
          typed: false,
          flattened: {
            nested: {
              includes_cryptographic_holder_binding: [
                "Credential query '5ff30b81-fd6b-4133-97c9-0c4520789e84' requires cryptographic holder binding",
              ],
            },
          },
          issues: expect.any(Array),
          output: {
            credential_format: 'mso_mdoc',
            doctype: 'PersonIdentificationData',
            includes_cryptographic_holder_binding: false,
            namespaces: {
              namespace: {
                given_name: 'foo',
              },
            },
          },
        },
      },
      valid_matches: {},
    })
  })
})
