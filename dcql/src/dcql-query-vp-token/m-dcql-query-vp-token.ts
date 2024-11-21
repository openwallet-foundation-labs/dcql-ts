import * as v from 'valibot';
import { DcqlEmptyVpToken } from '../e-dcql.js';
import { idRegex, vJsonRecord, vStringToJson } from '../u-dcql.js';

export namespace DcqlVpToken {
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

  export const validate = (vpToken: DcqlVpToken.Output) => {
    if (Object.values(vpToken).length === 0) {
      throw new DcqlEmptyVpToken({
        message: 'Empty Verifiable Presentation token',
      });
    }
  };
}
export type DcqlVpToken = DcqlVpToken.Output;
