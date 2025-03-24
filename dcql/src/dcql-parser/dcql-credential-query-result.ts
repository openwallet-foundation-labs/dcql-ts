import * as v from 'valibot'
import type { DcqlQueryResult } from '../dcql-query-result/m-dcql-query-result.js'
import type { DcqlCredentialQuery } from '../dcql-query/m-dcql-credential-query.js'
import type { DcqlCredential } from '../u-dcql-credential.js'
import type {} from '../u-dcql.js'
import { getCredentialQueryParser } from './dcql-claims-query-result.js'

export const runCredentialQuery = (
  credentialQuery: DcqlCredentialQuery,
  ctx: {
    credentials: DcqlCredential[]
    presentation: boolean
  }
): DcqlQueryResult.CredentialQueryResult => {
  const { credentials, presentation } = ctx
  const claimSets = credentialQuery.claim_sets ?? [undefined]

  const credentialQueryResult: v.InferInput<typeof DcqlQueryResult.vCredentialQueryResult> = []

  for (const [claimSetIndex, claim_set] of claimSets.entries()) {
    const credentialParser = getCredentialQueryParser(credentialQuery, {
      claimSet: claim_set,
      presentation,
    })

    const claimSetResult: (typeof credentialQueryResult)[number] = []

    for (const [credentialIndex, credential] of credentials.entries()) {
      if (claimSetIndex > 0) {
        // if one the credential was successfully parsed against a previous claimsset we don't need to further validate other claim sets
        const previous = credentialQueryResult[claimSetIndex - 1][credentialIndex]

        // if the previous credential was successfully parsed we don't need to further validate the current credential
        // we set all further parsing attempts to undefined
        if (previous?.success || !previous) {
          claimSetResult[credentialIndex] = undefined
          continue
        }
      }

      const parseResult = v.safeParse(credentialParser, credential)
      claimSetResult.push({
        ...parseResult,
        ...(parseResult.issues && {
          flattened: v.flatten<typeof credentialParser>(parseResult.issues),
        }),
        input_credential_index: credentialIndex,
        claim_set_index: credentialQuery.claim_sets ? claimSetIndex : undefined,
      })
    }

    credentialQueryResult.push(claimSetResult)
  }

  return credentialQueryResult as DcqlQueryResult.CredentialQueryResult
}
