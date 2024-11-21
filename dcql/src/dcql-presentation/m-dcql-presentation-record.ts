import * as v from 'valibot';
import { performDcqlQuery } from '../dcql-query/dcql-query.js';
import type { DcqlQuery } from '../dcql-query/m-dcql-query.js';
import {
  DcqlEmptyPresentationRecordError as DcqlEmptyPresentationRecord,
  DcqlInvalidPresentationRecordError,
} from '../e-dcql.js';
import type { DcqlCredentialRepresentation } from '../u-dcql-credential-representation.js';
import { idRegex, vJsonRecord, vStringToJson } from '../u-dcql.js';

export namespace DcqlPresentationRecord {
  export const vModel = v.record(
    v.pipe(v.string(), v.regex(idRegex)),
    v.union([v.string(), vJsonRecord])
  );

  export type Input = v.InferInput<typeof vModel>;
  export type Output = v.InferOutput<typeof vModel>;
  export const parse = (input: Input | string) => {
    if (typeof input === 'string') {
      return v.parse(v.pipe(v.string(), vStringToJson, vModel), input);
    }

    return v.parse(vModel, input);
  };

  export const encode = (input: Output) => {
    return JSON.stringify(input);
  };

  /**
   * Todo: Do the mapping from record to credential internally via a callback
   * @param dcqlQuery
   * @param credentials
   */
  export const validate = (
    credentials: DcqlCredentialRepresentation[],
    ctx: {
      dcqlQuery: DcqlQuery;
    }
  ) => {
    const { dcqlQuery } = ctx;
    if (Object.values(credentials).length === 0) {
      throw new DcqlEmptyPresentationRecord({
        message: 'No credentials provided',
      });
    }

    const result = performDcqlQuery(dcqlQuery, {
      credentials,
      presentation: true,
    });

    if (!result.canBeSatisfied) {
      throw new DcqlInvalidPresentationRecordError({
        message: 'Invalid Presentation record',
        cause: result,
      });
    }
  };
}
export type DcqlPresentationRecord = DcqlPresentationRecord.Output;
