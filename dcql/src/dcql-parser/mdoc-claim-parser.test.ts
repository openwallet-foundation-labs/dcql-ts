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

  it('shows error for missing namespace', () => {
    const parser = getMdocClaimParser({ path: ['custom.namespace', 'driving_privileges'] })
    const res = v.safeParse(parser, claimsPathPointerExample)

    expect(res.issues?.[0].message).toEqual("Expected claim 'custom.namespace'.'driving_privileges' to be defined")
  })

  it('shows error for correct namespace but missing claim', () => {
    const parser = getMdocClaimParser({ path: ['org.iso.18013.5.1', 'driving_privileges2'] })
    const res = v.safeParse(parser, claimsPathPointerExample)

    expect(res.issues?.[0].message).toEqual("Expected claim 'org.iso.18013.5.1'.'driving_privileges2' to be defined")
  })

  it('shows error for present namespace and claim, but incorrect value', () => {
    const parser = getMdocClaimParser({ path: ['org.iso.18013.5.1', 'family_name'], values: ['NotDent', 'WhyDent'] })
    const res = v.safeParse(parser, claimsPathPointerExample)

    expect(res.issues?.[0].message).toEqual(
      "Expected claim 'org.iso.18013.5.1'.'family_name' to be 'NotDent' | 'WhyDent' but received 'Dent'"
    )
  })
})
