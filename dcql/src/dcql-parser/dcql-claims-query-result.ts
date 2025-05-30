import * as v from 'valibot'
import { DcqlError } from '../dcql-error/e-base.js'
import { DcqlInvalidClaimsQueryIdError, DcqlMissingClaimSetParseError } from '../dcql-error/e-dcql.js'
import { DcqlClaimsQuery } from '../dcql-query/m-dcql-claims-query.js'
import type { DcqlCredentialQuery } from '../dcql-query/m-dcql-credential-query.js'
import { DcqlCredentialTrustedAuthority } from '../dcql-query/m-dcql-trusted-authorities.js'
import { vIncludesAll, vWithJT } from '../u-dcql.js'
import { vJson, vJsonRecord } from '../u-dcql.js'

const getTrustedAuthorityValue = (credentialQuery: DcqlCredentialQuery) =>
  v.object({
    authority: credentialQuery.trusted_authorities
      ? v.variant(
          'type',
          credentialQuery.trusted_authorities.map((t) =>
            v.object({ type: v.literal(t.type), value: v.union(t.values.map((value) => v.literal(value))) })
          ),
          `Credential query '${credentialQuery.id}' requires the credential to be issued by a trusted authority of type ${credentialQuery.trusted_authorities.map((t) => t.type).join(' | ')}, but none of the type or values match.`
        )
      : v.optional(DcqlCredentialTrustedAuthority.vModel),
  })

const getClaimParser = (input: {
  value?: string | number | boolean
  values?: (string | number | boolean)[]
}) => {
  const { value, values } = input
  if (value) {
    return vWithJT(v.literal(value))
  }

  if (values) {
    return vWithJT(v.union(values.map((val) => v.literal(val))))
  }

  return v.nonNullish(v.any())
}

export const getNamespacesParser = (claimsQueries: DcqlClaimsQuery.Mdoc[]) => {
  const claimsForNamespace: Record<string, DcqlClaimsQuery.MdocPath[]> = {}

  for (const claimQuery of claimsQueries) {
    // Normalize the query to the latest path syntax
    const mdocPathQuery: DcqlClaimsQuery.MdocPath = v.is(DcqlClaimsQuery.vMdocNamespace, claimQuery)
      ? {
          id: claimQuery.id,
          path: [claimQuery.namespace, claimQuery.claim_name],
          values: claimQuery.values,
        }
      : claimQuery

    const namespace = mdocPathQuery.path[0]
    if (claimsForNamespace[namespace]) {
      claimsForNamespace[namespace]?.push({ ...mdocPathQuery })
    } else {
      claimsForNamespace[namespace] = [{ ...mdocPathQuery }]
    }
  }

  const parsersForNamespaces = Object.entries(claimsForNamespace).map(([namespace, claims]) => {
    const claimParsers = Object.fromEntries(claims.map((claim) => [claim.path[1], getClaimParser(claim)]))
    return [namespace, v.object(claimParsers)]
  })

  return v.object(Object.fromEntries(parsersForNamespaces))
}

const getClaimQueryParser = (
  claimQuery: DcqlClaimsQuery.W3cAndSdJwtVc,
  ctx: { index: number; presentation: boolean }
): typeof vJson => {
  const { index, presentation } = ctx
  const pathElement = claimQuery.path[index]
  const isLast = index === claimQuery.path.length - 1

  const vClaimParser = getClaimParser(claimQuery)

  if (typeof pathElement === 'number') {
    const elementParser = isLast ? vClaimParser : getClaimQueryParser(claimQuery, { ...ctx, index: index + 1 })

    if (presentation) {
      // We allow both the concrete value and an array of one value
      return v.union([
        v.pipe(
          v.array(vJson),
          v.length(1),
          v.transform((input) => input[0]),
          elementParser
        ),
        elementParser,
      ])
    }

    return v.pipe(
      v.array(vJson),
      v.transform((input) => input[pathElement]),
      elementParser
    )
  }
  if (typeof pathElement === 'string') {
    return v.object({
      [pathElement]: isLast ? vClaimParser : getClaimQueryParser(claimQuery, { ...ctx, index: index + 1 }),
    })
  }
  return isLast ? v.array(vClaimParser) : v.array(getClaimQueryParser(claimQuery, { ...ctx, index: index + 1 }))
}

export const getJsonClaimsParser = (claimsQueries: DcqlClaimsQuery.W3cAndSdJwtVc[], ctx: { presentation: boolean }) => {
  const claimParser = v.intersect(
    claimsQueries.map(
      (claimQuery) =>
        getClaimQueryParser(claimQuery, {
          ...ctx,
          index: 0,
        }) as typeof vJsonRecord
    )
  )

  return claimParser
}

export const getMdocClaimsQueriesForClaimSet = (
  claimsQueries: DcqlClaimsQuery.Mdoc[],
  claimSet: string[]
): DcqlClaimsQuery.Mdoc[] => {
  return claimSet.map((credential_id) => {
    const query = claimsQueries.find((query) => query.id === credential_id)
    if (!query) {
      throw new DcqlInvalidClaimsQueryIdError({
        message: `Claims-query with id '${credential_id}' not found.`,
      })
    }

    return query
  })
}

export const getJsonClaimsQueriesForClaimSet = (
  claimsQueries: DcqlClaimsQuery.W3cAndSdJwtVc[],
  claimSet: string[]
): DcqlClaimsQuery.W3cAndSdJwtVc[] => {
  return claimSet.map((credential_id) => {
    const query = claimsQueries.find((query) => query.id === credential_id)
    if (!query) {
      throw new DcqlInvalidClaimsQueryIdError({
        message: `Claims-query with id '${credential_id}' not found.`,
      })
    }
    return query
  })
}

const getMdocParser = (
  credentialQuery: DcqlCredentialQuery.Mdoc,
  ctx: { claimSet?: NonNullable<DcqlCredentialQuery['claim_sets']>[number] }
) => {
  const { claimSet } = ctx

  const vDoctype = credentialQuery.meta?.doctype_value ? v.literal(credentialQuery.meta.doctype_value) : v.string()

  const claimSetQueries =
    credentialQuery.claims && claimSet
      ? getMdocClaimsQueriesForClaimSet(credentialQuery.claims, claimSet)
      : credentialQuery.claims

  const credentialParser = v.object({
    credential_format: v.literal('mso_mdoc'),
    doctype: vDoctype,
    namespaces: claimSetQueries
      ? getNamespacesParser(claimSetQueries)
      : v.record(v.string(), v.record(v.string(), v.unknown())),

    ...getTrustedAuthorityValue(credentialQuery).entries,
  })

  return credentialParser
}

const getW3cVcSdJwtVcParser = (
  credentialQuery: DcqlCredentialQuery.SdJwtVc | DcqlCredentialQuery.W3cVc,
  ctx: {
    claimSet?: NonNullable<DcqlCredentialQuery['claim_sets']>[number]
    presentation: boolean
  }
) => {
  const { claimSet } = ctx
  const claimSetQueries =
    credentialQuery.claims && claimSet
      ? getJsonClaimsQueriesForClaimSet(credentialQuery.claims, claimSet)
      : credentialQuery.claims

  if (credentialQuery.format === 'vc+sd-jwt' || credentialQuery.format === 'dc+sd-jwt') {
    return v.object({
      credential_format: v.literal(credentialQuery.format),
      vct: credentialQuery.meta?.vct_values ? v.picklist(credentialQuery.meta.vct_values) : v.string(),
      claims: claimSetQueries ? getJsonClaimsParser(claimSetQueries, ctx) : vJsonRecord,

      // TODO: we should split up the:
      // - vct
      // - claim value
      // - trusted authorities
      // into separate validations so we can make the match result richer with specifically
      // which steps failed, also we should look at showing exactly which claim paths failed.
      ...getTrustedAuthorityValue(credentialQuery).entries,
    })
  }

  if (credentialQuery.format === 'jwt_vc_json' || credentialQuery.format === 'ldp_vc') {
    return v.object({
      credential_format: v.literal(credentialQuery.format),
      claims: claimSetQueries ? getJsonClaimsParser(claimSetQueries, ctx) : vJsonRecord,
      type: credentialQuery.meta?.type_values
        ? v.union(
            credentialQuery.meta.type_values.map((values) => vIncludesAll(values)),
            `Type must include at least all values from one of the following subsets: ${credentialQuery.meta.type_values.map((values) => `[${values.join(', ')}]`).join(' | ')}`
          )
        : v.array(v.string()),

      ...getTrustedAuthorityValue(credentialQuery).entries,
    })
  }

  throw new DcqlError({
    code: 'NOT_IMPLEMENTED',
    message: `Usupported format '${credentialQuery.format}'`,
  })
}

export const getCredentialQueryParser = (
  credentialQuery: DcqlCredentialQuery,
  ctx: {
    claimSet?: NonNullable<DcqlCredentialQuery['claim_sets']>[number]
    presentation: boolean
  }
) => {
  if (credentialQuery.claim_sets && !ctx.claimSet) {
    throw new DcqlMissingClaimSetParseError({
      message: 'credentialQuery specifies claim_sets but no claim_set for parsing is provided.',
    })
  }

  if (credentialQuery.format === 'mso_mdoc') {
    return getMdocParser(credentialQuery, ctx)
  }
  return getW3cVcSdJwtVcParser(credentialQuery, ctx)
}
