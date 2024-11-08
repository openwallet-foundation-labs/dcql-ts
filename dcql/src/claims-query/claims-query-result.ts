import * as v from 'valibot';
import { DcqlInvalidClaimsQueryIdError } from '../e-dcql.js';
import { ClaimsQuery } from './m-claims-query.js';

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

  return ClaimsQuery.vValue;
};

export const getNamespacesParser = (claimsQueries: ClaimsQuery.Mdoc[]) => {
  const claimsForNamespace: Record<
    string,
    ReturnType<typeof getClaimsQueriesForClaimSet>
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

export const getClaimsQueriesForClaimSet = (
  claimsQueries: ClaimsQuery.Mdoc[],
  claimSet: string[]
): ClaimsQuery.Mdoc[] => {
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
