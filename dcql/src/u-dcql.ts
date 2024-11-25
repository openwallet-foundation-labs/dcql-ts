import * as v from 'valibot';
export const idRegex = /^[a-zA-Z0-9_-]+$/;

export const vNonEmptyArray = <T extends unknown[]>() => {
  return v.custom<[T[number], ...T]>(input =>
    (input as T).length > 0 ? true : false
  );
};

export const vIdString = v.pipe(v.string(), v.regex(idRegex));

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[];

export const vJsonLiteral = v.union([
  v.string(),
  v.number(),
  v.boolean(),
  v.null(),
]);
export type JsonLiteral = v.InferOutput<typeof vJsonLiteral>;

export const vJsonArray = v.array(vJsonLiteral);

export const vJson: v.GenericSchema<Json> = v.lazy(() =>
  v.union([vJsonLiteral, v.array(vJson), v.record(v.string(), vJson)])
);

export const vJsonRecord = v.record(v.string(), vJson);
export type JsonRecord = v.InferOutput<typeof vJsonRecord>;

export const vJsonValue = v.union([vJsonLiteral, vJsonArray, vJsonRecord]);

export const vStringToJson = v.rawTransform<string, Json>(
  ({ dataset, addIssue, NEVER }) => {
    try {
      return JSON.parse(dataset.value) as Json;
    } catch (error) {
      addIssue({ message: 'Invalid JSON' });
      return NEVER;
    }
  }
);
