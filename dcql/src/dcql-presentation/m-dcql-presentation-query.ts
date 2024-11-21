import * as v from 'valibot';

import { DcqlQueryResult } from '../dcql-query-result/m-dcql-query-result.js';
import { performDcqlQuery } from '../dcql-query/dcql-query.js';
import type { DcqlQuery } from '../dcql-query/m-dcql-query.js';
import { DcqlInvalidPresentationRecordError } from '../e-dcql.js';
import type { DcqlPresentationRepresentation } from '../u-dcql-credential-representation.js';
import { idRegex } from '../u-dcql.js';

export namespace DcqlPresentationQuery {
  export const vModel = v.object({
    ...DcqlQueryResult.vModel.entries,
    canBeSatisfied: v.literal(true),
    presentation_matches: v.record(
      v.pipe(v.string(), v.regex(idRegex)),
      v.object({
        ...v.omit(
          DcqlQueryResult.vModel.entries.credential_matches.value.options[0],
          ['all', 'issues', 'credential_index']
        ).entries,
        presentation_index: v.number(),
      })
    ),
  });

  export type Input = v.InferInput<typeof vModel>;
  export type Output = v.InferOutput<typeof vModel>;

  export type UnknownResult =
    | (DcqlQueryResult & {
        canBeSatisfied: false;
        presentation_matches?: undefined;
      })
    | DcqlPresentationQuery;

  export const parse = (input: Input | DcqlQueryResult) => {
    return v.parse(vModel, input);
  };

  /**
   * Query if the presentation record can be satisfied by the provided presentations
   * considering the dcql query
   *
   * @param dcqlQuery
   * @param presentations
   */
  export const query = (
    presentations: DcqlPresentationRepresentation[],
    ctx: { dcqlQuery: DcqlQuery }
  ): DcqlPresentationQuery.UnknownResult => {
    const { dcqlQuery } = ctx;

    const result = performDcqlQuery(dcqlQuery, {
      credentials: presentations,
      presentation: true,
    });

    if (!result.canBeSatisfied) {
      return { ...result, canBeSatisfied: false };
    }

    return fromDcqlQueryResult(result);
  };

  export const validate = (
    dcqlQueryResult: DcqlPresentationQuery.UnknownResult
  ): DcqlPresentationQuery => {
    if (!dcqlQueryResult.canBeSatisfied) {
      throw new DcqlInvalidPresentationRecordError({
        message: 'Invalid Presentation record',
        cause: dcqlQueryResult,
      });
    }

    return dcqlQueryResult;
  };

  export const fromDcqlQueryResult = (
    dcqlQueryResult: DcqlQueryResult
  ): DcqlPresentationQuery => {
    const { canBeSatisfied } = dcqlQueryResult;
    if (!canBeSatisfied) {
      throw new DcqlInvalidPresentationRecordError({
        message: 'Invalid Presentation record',
        cause: dcqlQueryResult,
      });
    }

    const presentation_matches: DcqlPresentationQuery['presentation_matches'] =
      {};

    if (!dcqlQueryResult.credential_sets) {
      for (const credentialQueryId of dcqlQueryResult.credentials.map(
        c => c.id
      )) {
        const match = dcqlQueryResult.credential_matches[credentialQueryId];
        if (!match?.success) {
          throw new DcqlInvalidPresentationRecordError({
            message: `Credential query ${credentialQueryId} is required but not satisfied.`,
          });
        }

        const { all, issues, credential_index, ...rest } = match;
        presentation_matches[credentialQueryId] = {
          ...rest,
          presentation_index: credential_index,
        };
      }

      return {
        ...dcqlQueryResult,
        canBeSatisfied,
        presentation_matches,
      };
    }

    for (const credentialSet of dcqlQueryResult.credential_sets ?? []) {
      const matchingOption = credentialSet.matching_options?.find(Boolean);
      if (!matchingOption) throw new Error('Invalid matching option');

      for (const credentialQueryId of matchingOption) {
        const match = dcqlQueryResult.credential_matches[credentialQueryId];
        if (match?.success) {
          const { all, issues, credential_index, ...rest } = match;
          presentation_matches[credentialQueryId] = {
            ...rest,
            presentation_index: credential_index,
          };
          continue;
        }

        if (credentialSet.required) {
          throw new DcqlInvalidPresentationRecordError({
            message: `Credential query ${credentialQueryId} is required but not satisfied.`,
          });
        }
      }
    }

    return {
      ...dcqlQueryResult,
      canBeSatisfied,
      presentation_matches,
    };
  };
}
export type DcqlPresentationQuery = DcqlPresentationQuery.Output;
