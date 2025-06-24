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
      nationalities: 'Betelgeusian',
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
})
