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
      v.parse(v.pipe(v.string(), vStringToJson, vModel), input);
    }

    return v.parse(vModel, input);
  };

  export const encode = (input: Output) => {
    return JSON.stringify(input);
  };

  export const validate = (
    input: Output,
    ctx: {
      dcqlQuery: DcqlQuery;
      credentials: DcqlCredentialRepresentation[];
    }
  ) => {
    if (Object.values(input).length === 0) {
      throw new DcqlEmptyPresentationRecord({
        message: 'Empty Presentation record',
      });
    }

    const result = performDcqlQuery(ctx.dcqlQuery, {
      ...ctx,
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
export type DcQlPresentationRecord = DcqlPresentationRecord.Output;
