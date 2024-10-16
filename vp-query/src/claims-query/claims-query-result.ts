import * as v from 'valibot';
import { InvalidClaimsQueryIdError } from '../e-vp-query.js';
import type { Mdoc } from '../u-query.js';
import { getIdMetadata } from '../u-query.js';
import type { ClaimsQueryResult } from './v-claims-query-result.js';
import { ClaimsQuery } from './v-claims-query.js';

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

export const getNamespacesParser = (
  claimsQueries: ReturnType<typeof getClaimsQueriesForClaimSet>
) => {
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
        claims.map(claim => [
          claim.claim_name,
          claim.isOptional || claim.isRequiredIfPresent
            ? v.optional(getClaimParser(claim))
            : getClaimParser(claim),
        ])
      );
      return [namespace, v.object(claimParsers)];
    }
  );

  return v.object(Object.fromEntries(parsersForNamespaces));
};

export const queryClaimFromMdoc = (
  claimsQuery: ClaimsQuery.Mdoc,
  credential: Mdoc
) => {
  const claimParser = getClaimParser(claimsQuery);
  const claimParsers =
    claimParser.type === 'union' ? claimParser.options : [claimParser];

  const namespace = credential.namespaces[claimsQuery.namespace];
  const claimParseResult: ClaimsQueryResult.ParseResult[] = [];
  for (const claimParser of claimParsers) {
    const parseResult = v.safeParse(
      claimParser,
      namespace?.[claimsQuery.claim_name]
    );

    const { typed, ...result } = parseResult;
    claimParseResult.push(result);
  }

  return claimParseResult;
};

export const getClaimsQueriesForClaimSet = (
  claimsQueries: ClaimsQuery.Mdoc[],
  claimSet?: string[]
) => {
  if (!claimSet) {
    return claimsQueries.map(query => ({
      ...query,
      isOptional: false,
      isRequiredIfPresent: false,
    }));
  }

  return claimSet.map(credential_id => {
    const { isOptional, isRequiredIfPresent, baseId } =
      getIdMetadata(credential_id);

    const query = claimsQueries.find(query => query.id === baseId);
    if (!query) {
      throw new InvalidClaimsQueryIdError({
        message: `Claims-query with id '${baseId}' not found.`,
      });
    }
    return { ...query, isOptional, isRequiredIfPresent };
  });
};
