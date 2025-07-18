import * as v from 'valibot'
import type { DcqlCredentialQuery } from '../dcql-query/m-dcql-credential-query.js'
import type { DcqlCredential } from '../u-dcql-credential.js'

import type { DcqlTrustedAuthoritiesResult } from '../dcql-query-result/m-trusted-authorities-result.js'
import { getTrustedAuthorityParser } from '../dcql-query/m-dcql-trusted-authorities.js'
import { type ToNonEmptyArray, asNonEmptyArrayOrUndefined } from '../u-dcql.js'

export const runTrustedAuthoritiesQuery = (
  credentialQuery: DcqlCredentialQuery,
  credential: DcqlCredential
): DcqlTrustedAuthoritiesResult => {
  if (!credentialQuery.trusted_authorities) {
    return {
      success: true,
    }
  }

  const failedTrustedAuthorities: v.InferOutput<
    typeof DcqlTrustedAuthoritiesResult.vTrustedAuthorityEntryFailureResult
  >[] = []

  for (const [trustedAuthorityIndex, trustedAuthority] of credentialQuery.trusted_authorities.entries()) {
    const trustedAuthorityParser = getTrustedAuthorityParser(trustedAuthority)
    const parseResult = v.safeParse(trustedAuthorityParser, credential.authority)

    if (parseResult.success) {
      return {
        success: true,
        valid_trusted_authority: {
          success: true,
          trusted_authority_index: trustedAuthorityIndex,
          output: parseResult.output,
        },
        failed_trusted_authorities: asNonEmptyArrayOrUndefined(failedTrustedAuthorities),
      }
    }

    const issues = v.flatten(parseResult.issues)
    failedTrustedAuthorities.push({
      success: false,
      trusted_authority_index: trustedAuthorityIndex,
      issues: issues.nested ?? issues,
      output: parseResult.output,
    })
  }

  return {
    success: false,
    failed_trusted_authorities: failedTrustedAuthorities as ToNonEmptyArray<typeof failedTrustedAuthorities>,
  }
}
