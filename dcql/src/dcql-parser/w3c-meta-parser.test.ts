import * as v from 'valibot'
import { describe, expect, it } from 'vitest'
import type { DcqlCredentialQuery } from '../dcql-query/index.js'
import type { DcqlMdocCredential, DcqlW3cVcCredential } from '../u-dcql-credential.js'
import { getMetaParser } from './dcql-meta-query-result.js'

const metaExample = {
  format: 'jwt_vc_json',
  id: '1d6b9512-c8bc-4698-a8ca-62c84fd90c0d',
  multiple: false,
  meta: {
    type_values: [['one', 'two'], ['three']],
  },
  require_cryptographic_holder_binding: true,
} satisfies DcqlCredentialQuery.W3cVc

const mdocCredentialExample = {
  credential_format: 'mso_mdoc',
  doctype: 'something',
  namespaces: {},
  cryptographic_holder_binding: true,
} satisfies DcqlMdocCredential

const credentialExample = {
  credential_format: 'jwt_vc_json',
  type: ['one', 'two'],
  claims: {},
  cryptographic_holder_binding: true,
} satisfies DcqlW3cVcCredential

describe('W3C Meta Parser', () => {
  it('meta with type', () => {
    const parser = getMetaParser(metaExample)
    const res = v.parse(parser, credentialExample)

    expect(res).toEqual({
      cryptographic_holder_binding: true,
      credential_format: 'jwt_vc_json',
      type: ['one', 'two'],
    })
  })

  it('shows error for invalid format', () => {
    const parser = getMetaParser(metaExample)
    const res = v.safeParse(parser, mdocCredentialExample)

    expect(res.issues?.[0].message).toEqual("Expected credential format to be 'jwt_vc_json' but received 'mso_mdoc'")
  })

  it('shows error for invalid type', () => {
    const parser = getMetaParser(metaExample)
    const res = v.safeParse(parser, { ...credentialExample, type: ['four'] })

    expect(res.issues?.[0].message).toEqual(
      'Expected type to include all values from one of the following subsets: [one, two] | [three]'
    )
  })
})
