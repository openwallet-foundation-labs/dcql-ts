import type { DcqlQueryResult } from '../dcql-query-result/m-dcql-query-result.js'
import type { DcqlCredentialQuery } from '../dcql-query/m-dcql-credential-query.js'
import type { DcqlCredential } from '../u-dcql-credential.js'
import { asNonEmptyArrayOrUndefined, isNonEmptyArray } from '../u-dcql.js'
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

  if (isNonEmptyArray(validCredentials)) {
    return {
      success: true,
      credential_query_id: credentialQuery.id,
      failed_credentials: asNonEmptyArrayOrUndefined(failedCredentials),
      valid_credentials: validCredentials,
    }
  }

  return {
    success: false,
    credential_query_id: credentialQuery.id,
    // Can be undefined if no credentials were provided to the query
    failed_credentials: asNonEmptyArrayOrUndefined(failedCredentials),
    valid_credentials: undefined,
  }
}
