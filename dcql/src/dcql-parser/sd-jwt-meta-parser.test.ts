import * as v from 'valibot'
import { describe, expect, it } from 'vitest'
import type { DcqlCredentialQuery } from '../dcql-query/index.js'
import type { DcqlMdocCredential, DcqlSdJwtVcCredential } from '../u-dcql-credential.js'
import { getMetaParser } from './dcql-meta-query-result.js'

const metaExample = {
  format: 'dc+sd-jwt',
  id: '1d6b9512-c8bc-4698-a8ca-62c84fd90c0d',
  multiple: false,
  meta: {
    vct_values: ['something', 'really-something'],
  },
  require_cryptographic_holder_binding: true,
} satisfies DcqlCredentialQuery.SdJwtVc

const mdocCredentialExample = {
  credential_format: 'mso_mdoc',
  doctype: 'something',
  namespaces: {},
  cryptographic_holder_binding: true,
} satisfies DcqlMdocCredential

const credentialExample = {
  credential_format: 'dc+sd-jwt',
  vct: 'something',
  claims: {},
  cryptographic_holder_binding: true,
} satisfies DcqlSdJwtVcCredential

const legacyMetaExample = {
  format: 'vc+sd-jwt',
  id: '1d6b9512-c8bc-4698-a8ca-62c84fd90c0d',
  multiple: false,
  meta: {
    vct_values: ['something', 'really-something'],
  },
  require_cryptographic_holder_binding: true,
} satisfies DcqlCredentialQuery.SdJwtVc

const legacyCredentialExample = {
  credential_format: 'vc+sd-jwt',
  vct: 'something',
  claims: {},
  cryptographic_holder_binding: true,
} satisfies DcqlSdJwtVcCredential

describe('SD-JWT VC Meta Parser', () => {
  it('meta with vct', () => {
    const parser = getMetaParser(metaExample)
    const res = v.parse(parser, credentialExample)

    expect(res).toEqual({
      cryptographic_holder_binding: true,
      credential_format: 'dc+sd-jwt',
      vct: 'something',
    })
  })

  // TODO: remove this test when we remove legacy SD-JWT VCs.
  it('legacy meta with vct', () => {
    const parser = getMetaParser(legacyMetaExample)
    const res = v.parse(parser, legacyCredentialExample)

    expect(res).toEqual({
      cryptographic_holder_binding: true,
      credential_format: 'vc+sd-jwt',
      vct: 'something',
    })
  })

  it('shows error for invalid format', () => {
    const parser = getMetaParser(metaExample)
    const res = v.safeParse(parser, mdocCredentialExample)

    expect(res.issues?.[0].message).toEqual("Expected credential format to be 'dc+sd-jwt' but received 'mso_mdoc'")
  })

  it('shows error for invalid vct', () => {
    const parser = getMetaParser(metaExample)
    const res = v.safeParse(parser, { ...credentialExample, vct: 'something-else' })

    expect(res.issues?.[0].message).toEqual(
      "Expected vct to be 'something' | 'really-something' but received 'something-else'"
    )
  })
})
