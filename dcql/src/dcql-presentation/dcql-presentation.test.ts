import { assert, describe, expect, test } from 'vitest'
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
      'c5d24076-71b1-4eb8-b3b2-1853a9f7e6b5': [
        {
          claims: {
            given_name: { foo: {} },
            family_name: { bar: {} },
          },
          credential_format: 'vc+sd-jwt' as const,
          vct: 'PersonIdentificationData',
          cryptographic_holder_binding: true,
        },
      ],
    }

    const parsedQuery = DcqlQuery.parse(dcqlQuery)
    DcqlQuery.validate(parsedQuery)

    const presentationQueryResult = DcqlPresentationResult.fromDcqlPresentation(dcqlPresentation, {
      dcqlQuery: parsedQuery,
    })

    expect(presentationQueryResult.can_be_satisfied).toEqual(false)
  })

  test('Correctly handles an SD-JWT VC presentation where a specific array index was requested, but presentation should not require the exact index due to possible array reordering with selective disclosure', () => {
    const dcqlQuery: DcqlQuery.Input = {
      credentials: [
        {
          id: 'c5d24076-71b1-4eb8-b3b2-1853a9f7e6b5',
          format: 'vc+sd-jwt',
          claims: [{ path: ['nationalities', 1], values: ['NL'] }],
        },
      ],
    }

    const dcqlPresentation = {
      'c5d24076-71b1-4eb8-b3b2-1853a9f7e6b5': [
        {
          claims: {
            // Only NL disclosed, so it's now at index 0 instead of the requested 1
            nationalities: ['NL'],
          },
          credential_format: 'vc+sd-jwt' as const,
          vct: 'PersonIdentificationData',
          cryptographic_holder_binding: true,
        },
      ],
    }

    const parsedQuery = DcqlQuery.parse(dcqlQuery)
    DcqlQuery.validate(parsedQuery)

    // For credential query it is not allowed, since the array index MUST match exactly
    const credentialQueryResult = DcqlQuery.query(parsedQuery, dcqlPresentation['c5d24076-71b1-4eb8-b3b2-1853a9f7e6b5'])
    assert(!credentialQueryResult.can_be_satisfied)

    const presentationQueryResult = DcqlPresentationResult.fromDcqlPresentation(dcqlPresentation, {
      dcqlQuery: parsedQuery,
    })

    // For presentations we allow the array ordering to be different
    assert(presentationQueryResult.can_be_satisfied)
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
      '8c791a1f-12b4-41fe-a892-236c2887fa8e': [
        {
          credential_format: 'vc+sd-jwt' as const,
          vct: 'PersonIdentificationData',
          cryptographic_holder_binding: true,
          claims: {
            tax_id_code: { baz: {} },
          },
        },
      ],
    }

    const parsedQuery = DcqlQuery.parse(query)
    DcqlQuery.validate(parsedQuery)

    const presentationQueryResult = DcqlPresentationResult.fromDcqlPresentation(dcqlPresentation, {
      dcqlQuery: parsedQuery,
    })

    expect(presentationQueryResult).toEqual({
      can_be_satisfied: true,
      credential_matches: {
        '8c791a1f-12b4-41fe-a892-236c2887fa8e': {
          success: true,
          credential_query_id: '8c791a1f-12b4-41fe-a892-236c2887fa8e',
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
                  credential_format: 'vc+sd-jwt',
                  cryptographic_holder_binding: true,
                  vct: 'PersonIdentificationData',
                },
              },
              claims: {
                success: true,
                failed_claim_sets: [
                  {
                    claim_set_index: 1,
                    success: false,
                    issues: {
                      given_name: ["Expected claim 'given_name' to be defined"],
                      family_name: ["Expected claim 'family_name' to be defined"],
                    },
                    failed_claim_indexes: [0, 1],
                    valid_claim_indexes: [2],
                  },
                ],
                valid_claim_sets: [
                  {
                    claim_set_index: 0,
                    success: true,
                    output: {
                      tax_id_code: {
                        baz: {},
                      },
                    },
                    valid_claim_indexes: [2],
                  },
                ],
                valid_claims: [
                  {
                    success: true,
                    claim_index: 2,
                    claim_id: 'c',
                    output: {
                      tax_id_code: {
                        baz: {},
                      },
                    },
                  },
                ],
                failed_claims: [
                  {
                    success: false,
                    issues: {
                      given_name: ["Expected claim 'given_name' to be defined"],
                    },
                    claim_index: 0,
                    claim_id: 'a',
                    output: {},
                  },
                  {
                    success: false,
                    issues: {
                      family_name: ["Expected claim 'family_name' to be defined"],
                    },
                    claim_index: 1,
                    claim_id: 'b',
                    output: {},
                  },
                ],
              },
            },
          ],
        },
      },
      credential_sets: undefined,
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
      '8c791a1f-12b4-41fe-a892-236c2887fa8e': [
        {
          credential_format: 'vc+sd-jwt' as const,
          vct: 'PersonIdentificationData',
          claims: {
            given_name: {
              foo: {},
            },
            family_name: {
              bar: {},
            },
          },
          cryptographic_holder_binding: true,
        },
      ],
    }

    const parsedQuery = DcqlQuery.parse(query)
    DcqlQuery.validate(parsedQuery)

    const presentationQueryResult = DcqlPresentationResult.fromDcqlPresentation(dcqlPresentation, {
      dcqlQuery: parsedQuery,
    })

    expect(presentationQueryResult).toEqual({
      can_be_satisfied: true,
      credential_matches: {
        '8c791a1f-12b4-41fe-a892-236c2887fa8e': {
          success: true,
          credential_query_id: '8c791a1f-12b4-41fe-a892-236c2887fa8e',
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
                  credential_format: 'vc+sd-jwt',
                  cryptographic_holder_binding: true,
                  vct: 'PersonIdentificationData',
                },
              },
              claims: {
                success: true,
                failed_claim_sets: [
                  {
                    success: false,
                    issues: {
                      tax_id_code: ["Expected claim 'tax_id_code' to be defined"],
                    },
                    claim_set_index: 0,
                    failed_claim_indexes: [2],
                    valid_claim_indexes: [0, 1],
                  },
                ],
                valid_claim_sets: [
                  {
                    success: true,
                    claim_set_index: 1,
                    output: {
                      given_name: {
                        foo: {},
                      },
                      family_name: {
                        bar: {},
                      },
                    },
                    valid_claim_indexes: [0, 1],
                  },
                ],
                valid_claims: [
                  {
                    success: true,
                    claim_index: 0,
                    claim_id: 'a',
                    output: {
                      given_name: {
                        foo: {},
                      },
                    },
                  },
                  {
                    success: true,
                    claim_index: 1,
                    claim_id: 'b',
                    output: {
                      family_name: {
                        bar: {},
                      },
                    },
                  },
                ],
                failed_claims: [
                  {
                    success: false,
                    issues: {
                      tax_id_code: ["Expected claim 'tax_id_code' to be defined"],
                    },
                    claim_index: 2,
                    claim_id: 'c',
                    output: {},
                  },
                ],
              },
            },
          ],
        },
      },
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
      '8c791a1f-12b4-41fe-a892-236c2887fa8e': [
        {
          credential_format: 'vc+sd-jwt' as const,
          vct: 'PersonIdentificationData',
          cryptographic_holder_binding: true,
          claims: {
            given_name: {
              foo: {},
            },
            family_name: {
              bar: {},
            },
          },
        },
      ],
    }

    const parsedQuery = DcqlQuery.parse(query)
    DcqlQuery.validate(parsedQuery)

    const presentationQueryResult = DcqlPresentationResult.fromDcqlPresentation(dcqlPresentation, {
      dcqlQuery: parsedQuery,
    })

    expect(presentationQueryResult).toEqual({
      can_be_satisfied: true,
      credential_sets: [
        {
          options: [['8c791a1f-12b4-41fe-a892-236c2887fa8e']],
          required: true,
          matching_options: [['8c791a1f-12b4-41fe-a892-236c2887fa8e']],
        },
      ],
      credential_matches: {
        '8c791a1f-12b4-41fe-a892-236c2887fa8e': {
          success: true,
          credential_query_id: '8c791a1f-12b4-41fe-a892-236c2887fa8e',
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
                  credential_format: 'vc+sd-jwt',
                  vct: 'PersonIdentificationData',
                  cryptographic_holder_binding: true,
                },
              },
              claims: {
                success: true,
                failed_claim_sets: [
                  {
                    success: false,
                    issues: {
                      tax_id_code: ["Expected claim 'tax_id_code' to be defined"],
                    },
                    claim_set_index: 0,
                    failed_claim_indexes: [2],
                    valid_claim_indexes: [0, 1],
                  },
                ],
                valid_claim_sets: [
                  {
                    success: true,
                    claim_set_index: 1,
                    output: {
                      given_name: {
                        foo: {},
                      },
                      family_name: {
                        bar: {},
                      },
                    },
                    valid_claim_indexes: [0, 1],
                  },
                ],
                valid_claims: [
                  {
                    success: true,
                    claim_index: 0,
                    claim_id: 'a',
                    output: {
                      given_name: {
                        foo: {},
                      },
                    },
                  },
                  {
                    success: true,
                    claim_index: 1,
                    claim_id: 'b',
                    output: {
                      family_name: {
                        bar: {},
                      },
                    },
                  },
                ],
                failed_claims: [
                  {
                    success: false,
                    issues: {
                      tax_id_code: ["Expected claim 'tax_id_code' to be defined"],
                    },
                    claim_index: 2,
                    claim_id: 'c',
                    output: {},
                  },
                ],
              },
            },
          ],
        },
      },
    })
  })

  test('Correctly handles a presentation with multiple credential sets where credentials from an optional credential set are missing', () => {
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
        {
          id: 'a46e92c0-847f-41f2-9218-2914e1d2388a',
          format: 'vc+sd-jwt',
          meta: { vct_values: ['SomeRandomVct'] },
          claims: [{ id: 'a', path: ['given_name'] }],
        },
      ],
      credential_sets: [
        {
          options: [['8c791a1f-12b4-41fe-a892-236c2887fa8e']],
          required: true,
        },
        {
          options: [['a46e92c0-847f-41f2-9218-2914e1d2388a']],
          required: false,
        },
      ],
    }

    const dcqlPresentation = {
      '8c791a1f-12b4-41fe-a892-236c2887fa8e': [
        {
          credential_format: 'vc+sd-jwt' as const,
          vct: 'PersonIdentificationData',
          claims: {
            given_name: { foo: {} },
            family_name: { bar: {} },
          },
          cryptographic_holder_binding: true,
        },
      ],
    }

    const parsedQuery = DcqlQuery.parse(query)
    DcqlQuery.validate(parsedQuery)

    const presentationQueryResult = DcqlPresentationResult.fromDcqlPresentation(dcqlPresentation, {
      dcqlQuery: parsedQuery,
    })

    expect(presentationQueryResult).toEqual({
      can_be_satisfied: true,
      credential_sets: [
        {
          options: [['8c791a1f-12b4-41fe-a892-236c2887fa8e']],
          required: true,
          matching_options: [['8c791a1f-12b4-41fe-a892-236c2887fa8e']],
        },
        {
          options: [['a46e92c0-847f-41f2-9218-2914e1d2388a']],
          required: false,
        },
      ],
      credential_matches: {
        '8c791a1f-12b4-41fe-a892-236c2887fa8e': {
          success: true,
          credential_query_id: '8c791a1f-12b4-41fe-a892-236c2887fa8e',
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
                  credential_format: 'vc+sd-jwt',
                  cryptographic_holder_binding: true,
                  vct: 'PersonIdentificationData',
                },
              },
              claims: {
                success: true,
                failed_claim_sets: [
                  {
                    success: false,
                    issues: {
                      tax_id_code: ["Expected claim 'tax_id_code' to be defined"],
                    },
                    claim_set_index: 0,
                    failed_claim_indexes: [2],
                    valid_claim_indexes: [0, 1],
                  },
                ],
                valid_claim_sets: [
                  {
                    success: true,
                    claim_set_index: 1,
                    output: {
                      given_name: {
                        foo: {},
                      },
                      family_name: {
                        bar: {},
                      },
                    },
                    valid_claim_indexes: [0, 1],
                  },
                ],
                valid_claims: [
                  {
                    success: true,
                    claim_index: 0,
                    claim_id: 'a',
                    output: {
                      given_name: {
                        foo: {},
                      },
                    },
                  },
                  {
                    success: true,
                    claim_index: 1,
                    claim_id: 'b',
                    output: {
                      family_name: {
                        bar: {},
                      },
                    },
                  },
                ],
                failed_claims: [
                  {
                    success: false,
                    issues: {
                      tax_id_code: ["Expected claim 'tax_id_code' to be defined"],
                    },
                    claim_index: 2,
                    claim_id: 'c',
                    output: {},
                  },
                ],
              },
            },
          ],
        },
      },
    })
  })

  test('Correctly handles a presentation with multiple credential sets where credentials from an optional credential set are provided but do not match the query', () => {
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
        {
          id: 'a46e92c0-847f-41f2-9218-2914e1d2388a',
          format: 'vc+sd-jwt',
          meta: { vct_values: ['SomeRandomVct'] },
          claims: [{ id: 'a', path: ['given_name'] }],
        },
      ],
      credential_sets: [
        {
          options: [['8c791a1f-12b4-41fe-a892-236c2887fa8e']],
          required: true,
        },
        {
          options: [['a46e92c0-847f-41f2-9218-2914e1d2388a']],
          required: false,
        },
      ],
    }

    const dcqlPresentation = {
      '8c791a1f-12b4-41fe-a892-236c2887fa8e': [
        {
          credential_format: 'vc+sd-jwt' as const,
          vct: 'PersonIdentificationData',
          cryptographic_holder_binding: true,
          claims: {
            given_name: { foo: {} },
            family_name: { bar: {} },
          },
        },
      ],
      'a46e92c0-847f-41f2-9218-2914e1d2388a': [
        {
          credential_format: 'vc+sd-jwt' as const,
          vct: 'PersonIdentificationData',
          cryptographic_holder_binding: true,
          claims: {
            given_name: { foo: {} },
            family_name: { bar: {} },
          },
        },
      ],
    }

    const parsedQuery = DcqlQuery.parse(query)
    DcqlQuery.validate(parsedQuery)

    const presentationQueryResult = DcqlPresentationResult.fromDcqlPresentation(dcqlPresentation, {
      dcqlQuery: parsedQuery,
    })

    expect(presentationQueryResult).toEqual({
      can_be_satisfied: false,
      credential_sets: [
        {
          options: [['8c791a1f-12b4-41fe-a892-236c2887fa8e']],
          required: true,
          matching_options: [['8c791a1f-12b4-41fe-a892-236c2887fa8e']],
        },
        {
          matching_options: undefined,
          options: [['a46e92c0-847f-41f2-9218-2914e1d2388a']],
          required: false,
        },
      ],
      credential_matches: {
        '8c791a1f-12b4-41fe-a892-236c2887fa8e': {
          success: true,
          credential_query_id: '8c791a1f-12b4-41fe-a892-236c2887fa8e',
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
                  credential_format: 'vc+sd-jwt',
                  cryptographic_holder_binding: true,
                  vct: 'PersonIdentificationData',
                },
              },
              claims: {
                success: true,
                failed_claim_sets: [
                  {
                    success: false,
                    issues: {
                      tax_id_code: ["Expected claim 'tax_id_code' to be defined"],
                    },
                    claim_set_index: 0,
                    failed_claim_indexes: [2],
                    valid_claim_indexes: [0, 1],
                  },
                ],
                valid_claim_sets: [
                  {
                    success: true,
                    claim_set_index: 1,
                    output: {
                      given_name: {
                        foo: {},
                      },
                      family_name: {
                        bar: {},
                      },
                    },
                    valid_claim_indexes: [0, 1],
                  },
                ],
                valid_claims: [
                  {
                    success: true,
                    claim_index: 0,
                    claim_id: 'a',
                    output: {
                      given_name: {
                        foo: {},
                      },
                    },
                  },
                  {
                    success: true,
                    claim_index: 1,
                    claim_id: 'b',
                    output: {
                      family_name: {
                        bar: {},
                      },
                    },
                  },
                ],
                failed_claims: [
                  {
                    success: false,
                    issues: {
                      tax_id_code: ["Expected claim 'tax_id_code' to be defined"],
                    },
                    claim_index: 2,
                    claim_id: 'c',
                    output: {},
                  },
                ],
              },
            },
          ],
        },
        'a46e92c0-847f-41f2-9218-2914e1d2388a': {
          success: false,
          credential_query_id: 'a46e92c0-847f-41f2-9218-2914e1d2388a',
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
                  vct: ["Expected vct to be 'SomeRandomVct' but received 'PersonIdentificationData'"],
                },
                output: {
                  cryptographic_holder_binding: true,
                  credential_format: 'vc+sd-jwt',
                  vct: 'PersonIdentificationData',
                },
              },
              claims: {
                success: true,
                failed_claim_sets: [],
                valid_claim_sets: [
                  {
                    success: true,
                    output: {
                      given_name: {
                        foo: {},
                      },
                    },
                    valid_claim_indexes: [0],
                  },
                ],
                valid_claims: [
                  {
                    success: true,
                    claim_index: 0,
                    claim_id: 'a',
                    output: {
                      given_name: {
                        foo: {},
                      },
                    },
                  },
                ],
                failed_claims: [],
              },
            },
          ],
        },
      },
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
        cryptographic_holder_binding: false,
        claims: {
          given_name: { foo: {} },
          family_name: { bar: {} },
        },
      },
      '5ff30b81-fd6b-4133-97c9-0c4520789e84': {
        credential_format: 'mso_mdoc',
        doctype: 'PersonIdentificationData',
        cryptographic_holder_binding: false,
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

    expect(
      presentationQueryResult.credential_matches['8c791a1f-12b4-41fe-a892-236c2887fa8e'].failed_credentials[0].meta
    ).toEqual({
      issues: {
        cryptographic_holder_binding: [
          "Expected cryptographic_holder_binding to be true but received false because credential query '8c791a1f-12b4-41fe-a892-236c2887fa8e' requires cryptographic holder binding",
        ],
      },
      output: {
        credential_format: 'vc+sd-jwt',
        cryptographic_holder_binding: false,
        vct: 'PersonIdentificationData',
      },
      success: false,
    })
  })
})
