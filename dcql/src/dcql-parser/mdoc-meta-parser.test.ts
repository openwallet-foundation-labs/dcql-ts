import * as v from 'valibot'
import { describe, expect, it } from 'vitest'
import type { DcqlCredentialQuery } from '../dcql-query/index.js'
import type { DcqlMdocCredential, DcqlSdJwtVcCredential } from '../u-dcql-credential.js'
import { getMetaParser } from './dcql-meta-query-result.js'

const metaExample = {
  format: 'mso_mdoc',
  id: '1d6b9512-c8bc-4698-a8ca-62c84fd90c0d',
  multiple: false,
  meta: {
    doctype_value: 'something',
  },
  require_cryptographic_holder_binding: true,
} satisfies DcqlCredentialQuery.Mdoc

const credentialExample = {
  credential_format: 'mso_mdoc',
  doctype: 'something',
  namespaces: {},
  cryptographic_holder_binding: true,
} satisfies DcqlMdocCredential

const sdJwtCredentialExample = {
  credential_format: 'dc+sd-jwt',
  vct: 'something',
  claims: {},
  cryptographic_holder_binding: true,
} satisfies DcqlSdJwtVcCredential

describe('Mdoc Meta Parser', () => {
  it('meta with doctype', () => {
    const parser = getMetaParser(metaExample)
    const res = v.parse(parser, credentialExample)

    expect(res).toEqual({
      cryptographic_holder_binding: true,
      credential_format: 'mso_mdoc',
      doctype: 'something',
    })
  })

  it('shows error for invalid format', () => {
    const parser = getMetaParser(metaExample)
    const res = v.safeParse(parser, sdJwtCredentialExample)

    expect(res.issues?.[0].message).toEqual("Expected credential format to be 'mso_mdoc' but received 'dc+sd-jwt'")
  })

  it('shows error for invalid doctype', () => {
    const parser = getMetaParser(metaExample)
    const res = v.safeParse(parser, { ...credentialExample, doctype: 'something-else' })

    expect(res.issues?.[0].message).toEqual("Expected doctype to be 'something' but received 'something-else'")
  })
})
