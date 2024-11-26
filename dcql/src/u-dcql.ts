import * as v from 'valibot';
import type { UnknownBaseSchema } from './u-model';
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

interface HasToJson {
  toJson(): Json;
}

function isToJsonable(value: unknown): value is HasToJson {
  if (value === null || typeof value !== 'object') return false;

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
  const toJsonFn = (value as any).toJson;
  return typeof toJsonFn === 'function';
}

export const vWithJT = <Schema extends UnknownBaseSchema>(schema: Schema) =>
  v.pipe(
    v.custom<v.InferInput<Schema>>(() => true),
    v.rawTransform<v.InferInput<Schema>, v.InferOutput<Schema>>(
      ({ dataset, addIssue, NEVER }) => {
        const result = v.safeParse(schema, dataset.value);
        if (result.success) return dataset.value;

        if (!isToJsonable(dataset.value)) {
          for (const safeParseIssue of result.issues) {
            addIssue({
              ...safeParseIssue,
              expected: safeParseIssue.expected ?? undefined,
            });
          }

          return NEVER;
        }

        let json: Json;

        try {
          json = dataset.value.toJson();
        } catch (error) {
          for (const safeParseIssue of result.issues) {
            addIssue({
              ...safeParseIssue,
              expected: safeParseIssue.expected ?? undefined,
            });
          }
          addIssue({ message: 'Json Transformation failed' });
          return NEVER;
        }

        const safeParseResult: v.SafeParseResult<Schema> = v.safeParse(
          schema,
          json
        );
        if (safeParseResult.success) return dataset.value;

        for (const safeParseIssue of safeParseResult.issues) {
          addIssue({
            ...safeParseIssue,
            expected: safeParseIssue.expected ?? undefined,
          });
        }

        return NEVER;
      }
    )
  );

export const vJsonLiteral = v.union([
  v.string(),
  v.number(),
  v.boolean(),
  v.null(),
]);

export type JsonLiteral = v.InferOutput<typeof vJsonLiteral>;

export const vJson: v.GenericSchema<Json> = v.lazy(() =>
  v.union([vJsonLiteral, v.array(vJson), v.record(v.string(), vJson)])
);

export const vJsonWithJT: v.GenericSchema<Json> = v.lazy(() =>
  vWithJT(v.union([vJsonLiteral, v.array(vJson), v.record(v.string(), vJson)]))
);

export const vJsonRecord = v.record(v.string(), vJson);
export type JsonRecord = v.InferOutput<typeof vJsonRecord>;

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
