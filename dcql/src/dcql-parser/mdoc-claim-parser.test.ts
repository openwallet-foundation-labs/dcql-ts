import * as v from 'valibot'
import { describe, expect, it } from 'vitest'
import { getMdocClaimParser } from './dcql-claims-query-result.js'

const claimsPathPointerExample = {
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

describe('Mdoc Claim Parser', () => {
  it('name', () => {
    const parser = getMdocClaimParser({ path: ['org.iso.18013.5.1', 'given_name'] })
    const res = v.parse(parser, claimsPathPointerExample)

    expect(res).toEqual({ 'org.iso.18013.5.1': { given_name: 'Arthur' } })
  })

  it('driving privileges', (_t) => {
    const parser = getMdocClaimParser({ path: ['org.iso.18013.5.1', 'driving_privileges'] })
    const res = v.parse(parser, claimsPathPointerExample)

    expect(res).toEqual({
      'org.iso.18013.5.1': {
        driving_privileges: [
          {
            name: 'something',
          },
        ],
      },
    })
  })
})
