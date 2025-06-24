import * as v from 'valibot'
import { DcqlParseError } from '../dcql-error/e-dcql.js'
import type { DcqlClaimsResult } from '../dcql-query-result/m-claims-result.js'
import { DcqlClaimsQuery } from '../dcql-query/m-dcql-claims-query.js'
import type { DcqlCredentialQuery } from '../dcql-query/m-dcql-credential-query.js'
import type { DcqlCredential } from '../u-dcql-credential.js'
import { type ToNonEmptyArray, type vBaseSchemaAny, vWithJT } from '../u-dcql.js'
import { vJson } from '../u-dcql.js'
import { deepMerge } from '../util/deep-merge.js'

const getClaimParser = (values?: DcqlClaimsQuery.ClaimValue[]) => {
  if (values) {
    return vWithJT(v.union(values.map((val) => v.literal(val))))
  }

  return v.pipe(
    v.unknown(),
    v.check((value) => value !== null || value !== undefined, 'Claim has no value')
  )
}

export const getMdocClaimParser = (claimQuery: DcqlClaimsQuery.Mdoc) => {
  // Normalize the query to the latest path syntax
  const mdocPathQuery: DcqlClaimsQuery.MdocPath = v.is(DcqlClaimsQuery.vMdocNamespace, claimQuery)
    ? {
        id: claimQuery.id,
        path: [claimQuery.namespace, claimQuery.claim_name],
        values: claimQuery.values,
      }
    : claimQuery

  const namespace = mdocPathQuery.path[0]
  const field = mdocPathQuery.path[1]

  return v.object({
    [namespace]: v.object({
      [field]: getClaimParser(claimQuery.values),
    }),
  })
}

export const getJsonClaimParser = (
  claimQuery: DcqlClaimsQuery.W3cAndSdJwtVc,
  ctx: { index: number; presentation: boolean }
): vBaseSchemaAny => {
  const { index, presentation } = ctx
  const pathElement = claimQuery.path[index]
  const isLast = index === claimQuery.path.length - 1
  const isFirst = index === 0

  const vClaimParser = getClaimParser(claimQuery.values)
  const message = isFirst
    ? claimQuery.values
      ? `Claim at path ${claimQuery.path.join(
          '.'
        )} does not contain one of the the expected values ${claimQuery.values.join(', ')}.`
      : `Claim at path ${claimQuery.path.join('.')} does not exist.`
    : undefined

  if (typeof pathElement === 'number') {
    const elementParser = isLast ? vClaimParser : getJsonClaimParser(claimQuery, { ...ctx, index: index + 1 })

    if (presentation) {
      // We allow both the concrete value and an array of one value
      return v.union(
        [
          v.pipe(
            v.array(vJson),
            v.someItem((item) => {
              const itemResult = v.safeParse(elementParser, item)
              return itemResult.success
            })
          ),
          elementParser,
        ],
        message
      )
    }

    return v.pipe(
      v.array(vJson),
      v.transform((input) => input[pathElement]),
      elementParser
    )
  }
  if (typeof pathElement === 'string') {
    return v.object(
      {
        [pathElement]: isLast ? vClaimParser : getJsonClaimParser(claimQuery, { ...ctx, index: index + 1 }),
      },
      message
    )
  }

  return v.pipe(
    v.array(v.any()),
    v.rawTransform(({ addIssue, dataset, NEVER }) => {
      console.log('raw transform')
      const mapped = dataset.value.map((item) => {
        const parsed = v.safeParse(
          isLast ? vClaimParser : getJsonClaimParser(claimQuery, { ...ctx, index: index + 1 }),
          item
        )

        return parsed
      })

      if (mapped.every((parsed) => !parsed.success)) {
        for (const parsed of mapped) {
          for (const issue of parsed.issues) {
            addIssue(issue)
          }
        }

        return NEVER
      }

      return mapped.map((parsed) => (parsed.success ? parsed.output : null))
    })
  )

  // return isLast
  //   ? v.array(vClaimParser)
  //   : v.array(
  //       getJsonClaimParser(claimQuery, { ...ctx, index: index + 1 }),
  //       message
  //     );
}

export const runClaimsQuery = (
  credentialQuery: DcqlCredentialQuery,
  ctx: {
    credential: DcqlCredential
    presentation: boolean
  }
): DcqlClaimsResult => {
  // No claims, always matches
  if (!credentialQuery.claims) {
    return {
      success: true,
      valid_claims: [],
      failed_claims: [],
      valid_claim_sets: [
        {
          claim_set_index: undefined,
          output: {},
          success: true,
          valid_claim_indexes: [],
        },
      ],
      failed_claim_sets: [],
    }
  }

  const failedClaims: Array<
    v.InferOutput<typeof DcqlClaimsResult.vClaimsEntryFailureResult> & {
      parser: vBaseSchemaAny
    }
  > = []
  const validClaims: Array<
    v.InferOutput<typeof DcqlClaimsResult.vClaimsEntrySuccessResult> & {
      parser: vBaseSchemaAny
    }
  > = []

  for (const [claimIndex, claimQuery] of credentialQuery.claims.entries()) {
    const parser =
      credentialQuery.format === 'mso_mdoc'
        ? getMdocClaimParser(claimQuery as DcqlClaimsQuery.Mdoc)
        : getJsonClaimParser(claimQuery as DcqlClaimsQuery.W3cAndSdJwtVc, {
            index: 0,
            presentation: ctx.presentation,
          })

    const parseResult = v.safeParse(
      parser,
      ctx.credential.credential_format === 'mso_mdoc' ? ctx.credential.namespaces : ctx.credential.claims
    )

    if (parseResult.success) {
      validClaims.push({
        success: true,
        claim_index: claimIndex,
        claim_id: claimQuery.id,
        output: parseResult.output,
        parser,
      })
    } else {
      failedClaims.push({
        success: false,
        issues: parseResult.issues,
        flattened: v.flatten(parseResult.issues),
        claim_index: claimIndex,
        claim_id: claimQuery.id,
        output: parseResult.output,
        parser,
      })
    }
  }

  const failedClaimSets: v.InferOutput<typeof DcqlClaimsResult.vClaimSetFailureResult>[] = []
  const validClaimSets: v.InferOutput<typeof DcqlClaimsResult.vClaimSetSuccessResult>[] = []

  for (const [claimSetIndex, claimSet] of credentialQuery.claim_sets?.entries() ?? [[undefined, undefined]]) {
    const claims = claimSet?.map((id) => {
      const claim =
        validClaims.find((claim) => claim.claim_id === id) ?? failedClaims.find((claim) => claim.claim_id === id)
      if (!claim) {
        throw new DcqlParseError({
          message: `Claim with id '${id}' in query '${credentialQuery.id}' from claim set with index '${claimSetIndex}' not found in claims of claim`,
        })
      }

      return claim
    }) ?? [...validClaims, ...failedClaims] // This handles the case where there is no claim sets (so we use all claims)

    if (claims.every((claim) => claim.success)) {
      const output = claims.reduce((merged, claim) => deepMerge(claim.output, merged), {})
      validClaimSets.push({
        success: true,
        claim_set_index: undefined,
        output,
        valid_claim_indexes: validClaims.map((claim) => claim.claim_index),
      })
    } else {
      failedClaimSets.push({
        success: false,
        claim_set_index: undefined,
        failed_claim_indexes: failedClaims.map((claim) => claim.claim_index) as [number, ...number[]],
        valid_claim_indexes: validClaims.map((claim) => claim.claim_index),
      })
    }
  }

  if (validClaimSets.length === 0) {
    return {
      success: false,
      failed_claim_sets: failedClaimSets as ToNonEmptyArray<typeof failedClaimSets>,
      failed_claims: failedClaims.map(({ parser, ...rest }) => rest) as ToNonEmptyArray<typeof failedClaims>,
      valid_claims: validClaims.map(({ parser, ...rest }) => rest),
    }
  }

  return {
    success: true,
    failed_claim_sets: failedClaimSets,
    valid_claim_sets: validClaimSets as ToNonEmptyArray<typeof validClaimSets>,
    valid_claims: validClaims.map(({ parser, ...rest }) => rest),
    failed_claims: failedClaims.map(({ parser, ...rest }) => rest),
  }
}
