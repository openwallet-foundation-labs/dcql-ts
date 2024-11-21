/* eslint-disable @typescript-eslint/no-non-null-assertion */
import * as v from 'valibot';
import { DcqlClaimsQuery } from '../dcql-query/m-dcql-claims-query.js';
import type { DcqlCredentialQuery } from '../dcql-query/m-dcql-credential-query.js';
import { DcqlInvalidClaimsQueryIdError } from '../e-dcql.js';
import { vJson, vJsonRecord } from '../u-dcql.js';

const getClaimParser = (input: {
  value?: string | number | boolean;
  values?: (string | number | boolean)[];
}) => {
  const { value, values } = input;
  if (value) {
    return v.literal(value);
  }

  if (values) {
    return v.union(values.map(val => v.literal(val)));
  }

  return DcqlClaimsQuery.vValue;
};

export const getNamespacesParser = (claimsQueries: DcqlClaimsQuery.Mdoc[]) => {
  const claimsForNamespace: Record<
    string,
    ReturnType<typeof getMdocClaimsQueriesForClaimSet>
  > = {};

  for (const claimQuery of claimsQueries) {
    if (claimsForNamespace[claimQuery.namespace]) {
      claimsForNamespace[claimQuery.namespace]?.push({ ...claimQuery });
    } else {
      claimsForNamespace[claimQuery.namespace] = [{ ...claimQuery }];
    }
  }

  const parsersForNamespaces = Object.entries(claimsForNamespace).map(
    ([namespace, claims]) => {
      const claimParsers = Object.fromEntries(
        claims.map(claim => [claim.claim_name, getClaimParser(claim)])
      );
      return [namespace, v.object(claimParsers)];
    }
  );

  return v.object(Object.fromEntries(parsersForNamespaces));
};

const getParserForClaimQuery = (
  claimQuery: DcqlClaimsQuery.W3cAndSdJwtVc,
  index: number
): typeof vJson => {
  const pathElement = claimQuery.path[index]!;
  const isLast = index === claimQuery.path.length - 1;

  const claimParser = claimQuery.values ? getClaimParser(claimQuery) : vJson;

  if (typeof pathElement === 'number') {
    return isLast
      ? v.pipe(
          v.array(claimParser),
          v.transform(input => input[pathElement]!)
        )
      : v.pipe(
          v.array(getParserForClaimQuery(claimQuery, index + 1)),
          v.transform(input => input[pathElement]!)
        );
  }

  if (typeof pathElement === 'string') {
    return v.object({
      [pathElement]: isLast
        ? claimParser
        : getParserForClaimQuery(claimQuery, index + 1),
    });
  }

  return isLast
    ? v.array(claimParser)
    : v.array(getParserForClaimQuery(claimQuery, index + 1));
};

export const getJsonClaimsParser = (
  claimsQueries: DcqlClaimsQuery.W3cAndSdJwtVc[]
) => {
  const claimParser = v.intersect(
    claimsQueries.map(
      claimQuery => getParserForClaimQuery(claimQuery, 0) as typeof vJsonRecord
    )
  );

  return claimParser;
};

export const getMdocClaimsQueriesForClaimSet = (
  claimsQueries: DcqlClaimsQuery.Mdoc[],
  claimSet: string[]
): DcqlClaimsQuery.Mdoc[] => {
  return claimSet.map(credential_id => {
    const query = claimsQueries.find(query => query.id === credential_id);
    if (!query) {
      throw new DcqlInvalidClaimsQueryIdError({
        message: `Claims-query with id '${credential_id}' not found.`,
      });
    }
    return query;
  });
};

export const getJsonClaimsQueriesForClaimSet = (
  claimsQueries: DcqlClaimsQuery.W3cAndSdJwtVc[],
  claimSet: string[]
): DcqlClaimsQuery.W3cAndSdJwtVc[] => {
  return claimSet.map(credential_id => {
    const query = claimsQueries.find(query => query.id === credential_id);
    if (!query) {
      throw new DcqlInvalidClaimsQueryIdError({
        message: `Claims-query with id '${credential_id}' not found.`,
      });
    }
    return query;
  });
};

const getMdocCredentialParser = (
  credentialQuery: DcqlCredentialQuery.Mdoc,
  claimSet?: NonNullable<DcqlCredentialQuery['claim_sets']>[number]
) => {
  const vDocType = credentialQuery.meta?.doctype_value
    ? v.literal(credentialQuery.meta.doctype_value)
    : v.string();

  const claimSetQueries =
    credentialQuery.claims && claimSet
      ? getMdocClaimsQueriesForClaimSet(credentialQuery.claims, claimSet)
      : credentialQuery.claims;

  const credentialParser = v.object({
    docType: vDocType,
    namespaces: claimSetQueries
      ? getNamespacesParser(claimSetQueries)
      : v.record(v.string(), v.record(v.string(), v.unknown())),
  });

  return credentialParser;
};

const getJsonCredentialParser = (
  credentialQuery: DcqlCredentialQuery.SdJwtVc | DcqlCredentialQuery.W3c,
  claimSet?: NonNullable<DcqlCredentialQuery['claim_sets']>[number]
) => {
  const claimSetQueries =
    credentialQuery.claims && claimSet
      ? getJsonClaimsQueriesForClaimSet(credentialQuery.claims, claimSet)
      : credentialQuery.claims;

  if (credentialQuery.format === 'vc+sd-jwt') {
    return v.object({
      vct: credentialQuery.meta?.vct_values
        ? v.picklist(credentialQuery.meta.vct_values)
        : v.string(),
      claims: claimSetQueries
        ? getJsonClaimsParser(claimSetQueries)
        : vJsonRecord,
    });
  } else {
    const credentialParser = v.object({
      claims: claimSetQueries
        ? getJsonClaimsParser(claimSetQueries)
        : vJsonRecord,
    });

    return credentialParser;
  }
};

export const getCredentialParser = (
  credentialQuery: DcqlCredentialQuery,
  claimSet?: NonNullable<DcqlCredentialQuery['claim_sets']>[number]
) => {
  if (credentialQuery.claim_sets && !claimSet) {
    throw new Error('asdfasdf');
  }

  if (credentialQuery.format === 'mso_mdoc') {
    return getMdocCredentialParser(credentialQuery, claimSet);
  } else {
    return getJsonCredentialParser(credentialQuery, claimSet);
  }
};
