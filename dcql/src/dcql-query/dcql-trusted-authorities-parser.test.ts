import * as v from 'valibot'
import { describe, expect, it } from 'vitest'
import type { DcqlCredentialTrustedAuthority, DcqlTrustedAuthoritiesQuery } from './index.js'
import { getTrustedAuthorityParser } from './m-dcql-trusted-authorities.js'

const authorityQueryExample = {
  type: 'aki',
  values: ['one', 'three'],
} satisfies DcqlTrustedAuthoritiesQuery

const authorityExample = {
  type: 'aki',
  values: ['one'],
} satisfies DcqlCredentialTrustedAuthority

describe('Trusted Authorities Parser', () => {
  it('valid authority', () => {
    const parser = getTrustedAuthorityParser(authorityQueryExample)
    const res = v.parse(parser, authorityExample)

    expect(res).toEqual({
      type: 'aki',
      value: 'one',
    })
  })

  it('shows error for invalid authority type', () => {
    const parser = getTrustedAuthorityParser(authorityQueryExample)
    const res = v.safeParse(parser, {
      ...authorityExample,
      type: 'openid_federation',
    })

    expect(res.issues?.[0].message).toEqual(
      "Expected trusted authority type to be 'aki' but received 'openid_federation'"
    )
  })

  it('shows error for invalid authority value', () => {
    const parser = getTrustedAuthorityParser(authorityQueryExample)
    const res = v.safeParse(parser, {
      ...authorityExample,
      values: ['two'],
    })

    expect(res.issues?.[0].message).toEqual(
      "Expected one of the trusted authority values to be 'one' | 'three' but received 'two'"
    )
  })
})
