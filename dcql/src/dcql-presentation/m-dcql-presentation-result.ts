import * as v from 'valibot';

import {
  DcqlInvalidPresentationRecordError,
  DcqlPresentationResultError,
} from '../dcql-error/e-dcql.js';
import { runCredentialQuery } from '../dcql-parser/dcql-credential-query-result.js';
import { DcqlQueryResult } from '../dcql-query-result/m-dcql-query-result.js';
import type { DcqlQuery } from '../dcql-query/m-dcql-query.js';
import { idRegex } from '../u-dcql.js';
import type { DcqlCredentialPresentation } from './m-dcql-credential-presentation.js';

export namespace DcqlPresentationResult {
  export const vModel = v.object({
    ...v.omit(DcqlQueryResult.vModel, ['credential_matches']).entries,

    invalid_matches: v.union([
      v.record(
        v.pipe(v.string(), v.regex(idRegex)),
        v.object({
          ...v.omit(
            DcqlQueryResult.vModel.entries.credential_matches.value.options[1],
            ['all', 'credential_index']
          ).entries,
          presentation_id: v.pipe(v.string(), v.regex(idRegex)),
        })
      ),
      v.undefined(),
    ]),

    valid_matches: v.record(
      v.pipe(v.string(), v.regex(idRegex)),
      v.object({
        ...v.omit(
          DcqlQueryResult.vModel.entries.credential_matches.value.options[0],
          ['all', 'issues', 'credential_index']
        ).entries,
        presentation_id: v.pipe(v.string(), v.regex(idRegex)),
      })
    ),
  });

  export type Input = v.InferInput<typeof vModel>;
  export type Output = v.InferOutput<typeof vModel>;

  export const parse = (input: Input | DcqlQueryResult) => {
    return v.parse(vModel, input);
  };

  /**
   * Query if the presentation record can be satisfied by the provided presentations
   * considering the dcql query
   *
   * @param dcqlQuery
   * @param dcqlPresentation
   */
  export const fromDcqlPresentation = (
    dcqlPresentation: Record<string, DcqlCredentialPresentation>,
    ctx: { dcqlQuery: DcqlQuery }
  ): Output => {
    const { dcqlQuery } = ctx;

    const presentationQueriesResults = Object.fromEntries(
      Object.entries(dcqlPresentation).map(([queryId, presentation]) => {
        const credentialQuery = dcqlQuery.credentials.find(
          c => c.id === queryId
        );
        if (!credentialQuery) {
          throw new DcqlPresentationResultError({
            message: `Query ${queryId} not found in the dcql query. Cannot validate presentation.`,
          });
        }

        return [
          queryId,
          runCredentialQuery(credentialQuery, {
            presentation: true,
            credentials: [presentation],
          }),
        ];
      })
    );

    let invalidMatches: DcqlPresentationResult['invalid_matches'] = undefined;
    const validMatches: DcqlPresentationResult['valid_matches'] = {};

    for (const [queryId, presentationQueryResult] of Object.entries(
      presentationQueriesResults
    )) {
      for (const presentationQueryResultForClaimSet of presentationQueryResult) {
        const result =
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          presentationQueryResultForClaimSet[0]!;
        if (result.success) {
          const { issues, credential_index, ...rest } = result;
          validMatches[queryId] = { ...rest, presentation_id: queryId };
        } else {
          if (!invalidMatches) invalidMatches = {};
          const { credential_index, ...rest } = result;
          invalidMatches[queryId] = {
            ...rest,
            presentation_id: queryId,
          };
        }
      }
    }

    const credentialSetResults = dcqlQuery.credential_sets?.map(set => {
      const matchingOptions = set.options.filter(option =>
        option.every(
          credentialQueryId => validMatches[credentialQueryId]?.success
        )
      );

      return {
        ...set,
        matching_options:
          matchingOptions.length > 0
            ? (matchingOptions as [string[], ...string[][]])
            : undefined,
      };
    }) as DcqlQueryResult.Output['credential_sets'];

    const dqclQueryMatched = credentialSetResults
      ? credentialSetResults.every(set => !set.required || set.matching_options)
      : !invalidMatches;

    return {
      ...dcqlQuery,
      canBeSatisfied: dqclQueryMatched,
      valid_matches: validMatches,
      invalid_matches: invalidMatches,
      credential_sets: credentialSetResults,
    };
  };

  export const validate = (dcqlQueryResult: DcqlPresentationResult) => {
    if (!dcqlQueryResult.canBeSatisfied) {
      throw new DcqlInvalidPresentationRecordError({
        message: 'Invalid Presentation record',
        cause: dcqlQueryResult,
      });
    }

    return dcqlQueryResult satisfies Output;
  };
}
export type DcqlPresentationResult = DcqlPresentationResult.Output;
