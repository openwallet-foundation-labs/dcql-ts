import type { DcqlQueryResult } from '../dcql-query-result/m-dcql-query-result.js'
import type { DcqlCredentialQuery } from '../dcql-query/m-dcql-credential-query.js'
import type { DcqlCredential } from '../u-dcql-credential.js'

import { DcqlError } from '../dcql-error/e-base.js'
import type { ToNonEmptyArray } from '../u-dcql.js'
import { runClaimsQuery } from './dcql-claims-query-result.js'
import { runMetaQuery } from './dcql-meta-query-result.js'
import { runTrustedAuthoritiesQuery } from './dcql-trusted-authorities-result.js'

export const runCredentialQuery = (
  credentialQuery: DcqlCredentialQuery,
  ctx: {
    credentials: DcqlCredential[]
    presentation: boolean
  }
): DcqlQueryResult.CredentialQueryItemResult => {
  const { credentials, presentation } = ctx

  if (ctx.credentials.length === 0) {
    throw new DcqlError({
      message:
        'Credentials array provided to credential query has length of 0, unable to match credentials against credential query.',
      code: 'BAD_REQUEST',
    })
  }

  const validCredentials: DcqlQueryResult.CredentialQueryItemCredentialSuccessResult[] = []
  const failedCredentials: DcqlQueryResult.CredentialQueryItemCredentialFailureResult[] = []

  for (const [credentialIndex, credential] of credentials.entries()) {
    const trustedAuthorityResult = runTrustedAuthoritiesQuery(credentialQuery, credential)
    const claimsResult = runClaimsQuery(credentialQuery, { credential, presentation })
    const metaResult = runMetaQuery(credentialQuery, credential)

    // if we found a valid claim set and trusted authority, the credential succeeded processing
    if (claimsResult.success && trustedAuthorityResult.success && metaResult.success) {
      validCredentials.push({
        success: true,

        input_credential_index: credentialIndex,
        trusted_authorities: trustedAuthorityResult,
        meta: metaResult,
        claims: claimsResult,
      })
    } else {
      failedCredentials.push({
        success: false,
        input_credential_index: credentialIndex,
        trusted_authorities: trustedAuthorityResult,
        meta: metaResult,
        claims: claimsResult,
      })
    }
  }

  // TODO: in case of presentation, we should return false if any credential is invalid
  // Question is whether we do that here, or on a higher level
  if (!validCredentials.length) {
    return {
      success: false,
      credential_query_id: credentialQuery.id,
      // We now for sure that there's at least one invalid credential if there's no valid one.
      failed_credentials: failedCredentials as ToNonEmptyArray<typeof failedCredentials>,
      valid_credentials: undefined,
    }
  }

  return {
    success: true,
    credential_query_id: credentialQuery.id,
    failed_credentials: failedCredentials,
    // We now for sure that there's at least one valid credential due to the length check
    valid_credentials: validCredentials as ToNonEmptyArray<typeof validCredentials>,
  }
}
