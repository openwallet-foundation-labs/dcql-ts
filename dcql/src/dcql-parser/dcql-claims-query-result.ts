import * as v from 'valibot'
import { DcqlParseError } from '../dcql-error/e-dcql.js'
import type { DcqlClaimsResult } from '../dcql-query-result/m-claims-result.js'
import { DcqlClaimsQuery } from '../dcql-query/m-dcql-claims-query.js'
import type { DcqlCredentialQuery } from '../dcql-query/m-dcql-credential-query.js'
import type { DcqlCredential } from '../u-dcql-credential.js'
import type { ToNonEmptyArray, vBaseSchemaAny } from '../u-dcql.js'
import { deepMerge } from '../util/deep-merge.js'

const pathToString = (path: Array<string | null | number>) =>
  path.map((item) => (typeof item === 'string' ? `'${item}'` : `${item}`)).join('.')

const getClaimParser = (path: Array<string | number | null>, values?: DcqlClaimsQuery.ClaimValue[]) => {
  if (values) {
    return v.union(
      values.map((val) =>
        v.literal(
          val,
          (i) =>
            `Expected claim ${pathToString(path)} to be ${typeof val === 'string' ? `'${val}'` : val} but received ${typeof i.input === 'string' ? `'${i.input}'` : i.input}`
        )
      ),
      (i) =>
        `Expected claim ${pathToString(path)} to be ${values.map((v) => (typeof v === 'string' ? `'${v}'` : v)).join(' | ')} but received ${typeof i.input === 'string' ? `'${i.input}'` : i.input}`
    )
  }

  return v.pipe(
    v.unknown(),
    v.check((value) => value !== null && value !== undefined, `Expected claim '${path.join("'.'")}' to be defined`)
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

  return v.object(
    {
      [namespace]: v.object(
        {
          [field]: getClaimParser(mdocPathQuery.path, claimQuery.values),
        },
        `Expected claim ${pathToString(mdocPathQuery.path)} to be defined`
      ),
    },
    `Expected claim ${pathToString(mdocPathQuery.path)} to be defined`
  )
}

export const getJsonClaimParser = (
  claimQuery: DcqlClaimsQuery.W3cAndSdJwtVc,
  ctx: { index: number; presentation: boolean }
): vBaseSchemaAny => {
  const { index, presentation } = ctx
  const pathElement = claimQuery.path[index]
  const isLast = index === claimQuery.path.length - 1

  const vClaimParser = getClaimParser(claimQuery.path, claimQuery.values)

  if (typeof pathElement === 'number') {
    const elementParser = isLast ? vClaimParser : getJsonClaimParser(claimQuery, { ...ctx, index: index + 1 })

    if (presentation) {
      return v.pipe(
        v.array(v.any(), `Expected path ${pathToString(claimQuery.path.slice(0, index + 1))} to be an array`),
        v.rawTransform(({ dataset, addIssue }) => {
          const issues = []
          for (const item of dataset.value) {
            const itemResult = v.safeParse(elementParser, item)

            if (itemResult.success) {
              return dataset.value
            }

            issues.push(itemResult.issues[0])
          }

          addIssue({
            ...issues[0],
            message: isLast
              ? issues[0].message
              : `Expected any element in array ${pathToString(claimQuery.path.slice(0, index + 1))} to match sub requirement but none matched: ${issues[0].message}`,
          })

          return dataset.value
        })
      )
    }

    return v.pipe(
      v.array(v.any(), `Expected path ${pathToString(claimQuery.path.slice(0, index + 1))} to be an array`),
      v.rawTransform(({ addIssue, dataset, NEVER }) => {
        // Validate the specific element
        const result = v.safeParse(elementParser, dataset.value[pathElement])
        if (!result.success) {
          addIssue(result.issues[0])
          return NEVER
        }

        // We need to preserve array ordering, so we add null elements for all items
        // before the current pathElement number
        return [...dataset.value.slice(0, pathElement).map(() => null), result.output]
      })
    )
  }

  if (typeof pathElement === 'string') {
    return v.object(
      {
        [pathElement]: isLast ? vClaimParser : getJsonClaimParser(claimQuery, { ...ctx, index: index + 1 }),
      },
      `Expected claim ${pathToString(claimQuery.path)} to be defined`
    )
  }

  return v.pipe(
    v.array(v.any(), `Expected path ${pathToString(claimQuery.path.slice(0, index + 1))} to be an array`),
    v.rawTransform(({ addIssue, dataset, NEVER }) => {
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
      const flattened = v.flatten(parseResult.issues)
      failedClaims.push({
        success: false,
        issues: flattened.nested ?? flattened,
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
        claim_set_index: claimSetIndex,
        output,
        valid_claim_indexes: claims.map((claim) => claim.claim_index),
      })
    } else {
      const issues = failedClaims.reduce((merged, claim) => deepMerge(claim.issues, merged), {})
      failedClaimSets.push({
        success: false,
        issues,
        claim_set_index: claimSetIndex,
        failed_claim_indexes: claims.filter((claim) => !claim.success).map((claim) => claim.claim_index) as [
          number,
          ...number[],
        ],
        valid_claim_indexes: claims.filter((claim) => claim.success).map((claim) => claim.claim_index),
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
