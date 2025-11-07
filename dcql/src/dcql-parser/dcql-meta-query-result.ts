import * as v from 'valibot'
import { DcqlError } from '../dcql-error/e-base.js'
import type { DcqlCredentialQuery } from '../dcql-query/m-dcql-credential-query.js'
import type { DcqlMetaResult } from '../dcql-query-result/m-meta-result.js'
import { vIncludesAll, vNonEmptyArray } from '../u-dcql.js'
import type { DcqlCredential } from '../u-dcql-credential.js'

const getCryptographicHolderBindingValue = (credentialQuery: DcqlCredentialQuery) =>
  v.object({
    cryptographic_holder_binding: credentialQuery.require_cryptographic_holder_binding
      ? v.literal(
          true,
          (i) =>
            `Expected cryptographic_holder_binding to be true (because credential query '${credentialQuery.id}' requires cryptographic holder binding), but received ${i.input}`
        )
      : v.boolean(),
  })

const getMdocMetaParser = (credentialQuery: DcqlCredentialQuery.Mdoc) => {
  const vDoctype = credentialQuery.meta?.doctype_value
    ? v.literal(
        credentialQuery.meta.doctype_value,
        (i) => `Expected doctype to be '${credentialQuery.meta?.doctype_value}' but received '${i.input}'`
      )
    : v.string('Expected doctype to be defined')

  const credentialParser = v.object({
    credential_format: v.literal(
      'mso_mdoc',
      (i) => `Expected credential format to be 'mso_mdoc' but received '${i.input}'`
    ),
    doctype: vDoctype,
    ...getCryptographicHolderBindingValue(credentialQuery).entries,
  })

  return credentialParser
}

const getSdJwtVcMetaParser = (credentialQuery: DcqlCredentialQuery.SdJwtVc) => {
  return v.object({
    credential_format: v.literal(
      credentialQuery.format,
      (i) => `Expected credential format to be '${credentialQuery.format}' but received '${i.input}'`
    ),
    vct: credentialQuery.meta?.vct_values
      ? v.picklist(
          credentialQuery.meta.vct_values,
          (i) => `Expected vct to be '${credentialQuery.meta?.vct_values?.join("' | '")}' but received '${i.input}'`
        )
      : v.string('Expected vct to be defined'),
    ...getCryptographicHolderBindingValue(credentialQuery).entries,
  })
}

const getW3cVcMetaParser = (credentialQuery: DcqlCredentialQuery.W3cVc) => {
  return v.object({
    credential_format: v.literal(
      credentialQuery.format,
      (i) => `Expected credential format to be '${credentialQuery.format}' but received '${i.input}'`
    ),
    type: credentialQuery.meta?.type_values
      ? v.union(
          credentialQuery.meta.type_values.map((values) => vIncludesAll(values)),
          `Expected type to include all values from one of the following subsets: ${credentialQuery.meta.type_values
            .map((values) => `[${values.join(', ')}]`)
            .join(' | ')}`
        )
      : vNonEmptyArray(v.string()),
    ...getCryptographicHolderBindingValue(credentialQuery).entries,
  })
}

export const getMetaParser = (credentialQuery: DcqlCredentialQuery) => {
  if (credentialQuery.format === 'mso_mdoc') {
    return getMdocMetaParser(credentialQuery)
  }

  if (credentialQuery.format === 'dc+sd-jwt') {
    return getSdJwtVcMetaParser(credentialQuery)
  }

  if (credentialQuery.format === 'vc+sd-jwt') {
    if (credentialQuery.meta && 'type_values' in credentialQuery.meta) {
      return getW3cVcMetaParser(credentialQuery as DcqlCredentialQuery.W3cVc)
    }

    return getSdJwtVcMetaParser(credentialQuery as DcqlCredentialQuery.SdJwtVc)
  }

  if (credentialQuery.format === 'ldp_vc' || credentialQuery.format === 'jwt_vc_json') {
    return getW3cVcMetaParser(credentialQuery)
  }

  throw new DcqlError({
    code: 'NOT_IMPLEMENTED',
    message: `Unsupported format '${credentialQuery.format}'`,
  })
}

export const runMetaQuery = (credentialQuery: DcqlCredentialQuery, credential: DcqlCredential): DcqlMetaResult => {
  const metaParser = getMetaParser(credentialQuery)
  const parseResult = v.safeParse(metaParser, credential)

  if (!parseResult.success) {
    const issues = v.flatten(parseResult.issues)
    return {
      success: false,
      issues: issues.nested ?? issues,
      output: parseResult.output,
    }
  }

  return {
    success: true,
    output: parseResult.output,
  }
}
