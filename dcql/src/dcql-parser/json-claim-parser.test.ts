import * as v from 'valibot'
import { describe, expect, it } from 'vitest'
import { getJsonClaimParser } from './dcql-claims-query-result.js'

const claimsPathPointerExample = {
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
      university: 'University of Betelgeuse',
    },
  ],
  nationalities: ['British', 'Betelgeusian'],
}

describe('Json Claim Parser', () => {
  it('name', (_t) => {
    const parser = getJsonClaimParser(
      { path: ['name'] },
      {
        index: 0,
        presentation: false,
      }
    )
    const res = v.parse(parser, claimsPathPointerExample)

    expect(res).toEqual({ name: 'Arthur Dent' })
  })

  it('address', (_t) => {
    const parser = getJsonClaimParser(
      { path: ['address'] },
      {
        presentation: false,
        index: 0,
      }
    )
    const res = v.parse(parser, claimsPathPointerExample)

    expect(res).toEqual({
      address: {
        street_address: '42 Market Street',
        locality: 'Milliways',
        postal_code: '12345',
      },
    })
  })

  it('address street address', (_t) => {
    const parser = getJsonClaimParser({ path: ['address', 'street_address'] }, { presentation: false, index: 0 })
    const res = v.parse(parser, claimsPathPointerExample)

    expect(res).toEqual({
      address: {
        street_address: '42 Market Street',
      },
    })
  })

  it('nationalities', (_t) => {
    const parser = getJsonClaimParser(
      { path: ['nationalities', 1] },
      {
        presentation: false,
        index: 0,
      }
    )
    const res = v.parse(parser, claimsPathPointerExample)

    expect(res).toEqual({
      nationalities: [null, 'Betelgeusian'],
    })
  })

  it('all degree types', (_t) => {
    const parser = getJsonClaimParser(
      { path: ['degrees', null, 'type'] },
      {
        presentation: false,
        index: 0,
      }
    )
    const res = v.parse(parser, claimsPathPointerExample)

    expect(res).toEqual({
      degrees: [{ type: 'Bachelor of Science' }, { type: 'Master of Science' }],
    })
  })

  it('all nationalities with path null query', (_t) => {
    const parser = getJsonClaimParser(
      { path: ['nationalities', null] },
      {
        presentation: false,
        index: 0,
      }
    )
    const res = v.parse(parser, claimsPathPointerExample)

    expect(res).toEqual({
      nationalities: ['British', 'Betelgeusian'],
    })
  })

  it('all nationalities with path null query with values', (_t) => {
    const parser = getJsonClaimParser(
      { path: ['nationalities', null], values: ['British', 'Something'] },
      {
        presentation: false,
        index: 0,
      }
    )
    const res = v.parse(parser, claimsPathPointerExample)

    expect(res).toEqual({
      nationalities: ['British', null],
    })
  })

  it('all items from first nationality results in error due to nationality not being an array', (_t) => {
    const parser = getJsonClaimParser(
      { path: ['nationalities', 0, null], values: ['British', 'Something'] },
      {
        presentation: false,
        index: 0,
      }
    )
    const res = v.safeParse(parser, claimsPathPointerExample)
    expect(res.issues?.[0].message).toEqual("Expected path 'nationalities'.0.null to be an array")
  })

  it('all items from first nationality results in error due to nationality not being an array', (_t) => {
    const parser = getJsonClaimParser(
      { path: ['nationalities', 0, null], values: ['British', 'Something'] },
      {
        presentation: true,
        index: 0,
      }
    )
    const res = v.safeParse(parser, claimsPathPointerExample)
    expect(res.issues?.[0].message).toEqual(
      "Expected any element in array 'nationalities'.0 to match sub requirement but none matched: Expected path 'nationalities'.0.null to be an array"
    )
  })
})
