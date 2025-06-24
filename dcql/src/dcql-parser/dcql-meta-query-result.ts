import * as v from 'valibot'
import { DcqlError } from '../dcql-error/e-base.js'
import type { DcqlMetaResult } from '../dcql-query-result/m-meta-result.js'
import type { DcqlCredentialQuery } from '../dcql-query/m-dcql-credential-query.js'
import type { DcqlCredential } from '../u-dcql-credential.js'
import { vIncludesAll, vNonEmptyArray } from '../u-dcql.js'

const getMdocMetaParser = (credentialQuery: DcqlCredentialQuery.Mdoc) => {
  const vDoctype = credentialQuery.meta?.doctype_value ? v.literal(credentialQuery.meta.doctype_value) : v.string()

  const credentialParser = v.object({
    credential_format: v.literal('mso_mdoc'),
    doctype: vDoctype,
  })

  return credentialParser
}

const getSdJwtVcMetaParser = (credentialQuery: DcqlCredentialQuery.SdJwtVc) => {
  return v.object({
    credential_format: v.literal(credentialQuery.format),
    vct: credentialQuery.meta?.vct_values ? v.picklist(credentialQuery.meta.vct_values) : v.string(),
  })
}

const getW3cVcMetaParser = (credentialQuery: DcqlCredentialQuery.W3cVc) => {
  return v.object({
    credential_format: v.literal(credentialQuery.format),
    type: credentialQuery.meta?.type_values
      ? v.union(
          credentialQuery.meta.type_values.map((values) => vIncludesAll(values)),
          `Type must include at least all values from one of the following subsets: ${credentialQuery.meta.type_values
            .map((values) => `[${values.join(', ')}]`)
            .join(' | ')}`
        )
      : vNonEmptyArray(v.string()),
  })
}

export const getMetaParser = (credentialQuery: DcqlCredentialQuery) => {
  if (credentialQuery.format === 'mso_mdoc') {
    return getMdocMetaParser(credentialQuery)
  }

  if (credentialQuery.format === 'dc+sd-jwt' || credentialQuery.format === 'vc+sd-jwt') {
    return getSdJwtVcMetaParser(credentialQuery)
  }

  if (credentialQuery.format === 'ldp_vc' || credentialQuery.format === 'jwt_vc_json') {
    return getW3cVcMetaParser(credentialQuery)
  }

  throw new DcqlError({
    code: 'NOT_IMPLEMENTED',
    message: `Usupported format '${credentialQuery.format}'`,
  })
}

export const runMetaQuery = (credentialQuery: DcqlCredentialQuery, credential: DcqlCredential): DcqlMetaResult => {
  const metaParser = getMetaParser(credentialQuery)
  const parseResult = v.safeParse(metaParser, credential)

  if (!parseResult.success) {
    return {
      success: false,
      issues: parseResult.issues,
      flattened: v.flatten(parseResult.issues),
      output: parseResult.output,
    }
  }

  return {
    success: true,
    output: parseResult.output,
  }
}
