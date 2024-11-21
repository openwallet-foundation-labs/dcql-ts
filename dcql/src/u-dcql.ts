import * as v from 'valibot';
export const idRegex = /^[a-zA-Z0-9_-]+$/;

export const vCredentialFormat = v.picklist([
  'mso_mdoc',
  'vc+sd-jwt',
  'jwt_vc_json',
  'jwt_vc_json-ld',
]);

export const vNonEmptyArray = <T extends unknown[]>() => {
  return v.custom<[T[number], ...T]>(input =>
    (input as T).length > 0 ? true : false
  );
};

export const vIdString = v.pipe(v.string(), v.regex(idRegex));

type JSON = string | number | boolean | null | { [key: string]: JSON } | JSON[];

export const vJsonLiteral = v.union([
  v.string(),
  v.number(),
  v.boolean(),
  v.null(),
]);
export type JsonLiteral = v.InferOutput<typeof vJsonLiteral>;

export const vJsonArray = v.array(vJsonLiteral);

export const vJson: v.GenericSchema<JSON> = v.lazy(() =>
  v.union([vJsonLiteral, v.array(vJson), v.record(v.string(), vJson)])
);

export const vJsonRecord = v.record(v.string(), vJson);
export type JsonRecord = v.InferOutput<typeof vJsonRecord>;

export const vJsonValue = v.union([vJsonLiteral, vJsonArray, vJsonRecord]);

export const vStringToTransform = v.rawTransform<string, JSON>(
  ({ dataset, addIssue, NEVER }) => {
    try {
      return JSON.parse(dataset.value) as JSON;
    } catch (error) {
      addIssue({ message: 'Invalid JSON' });
      return NEVER;
    }
  }
);

export const vParseSuccess = v.object({
  success: v.literal(true),
  typed: v.literal(true),
  output: v.unknown(),
  issues: v.optional(v.undefined()),
  credential_index: v.number(),
  claim_set_index: v.union([v.number(), v.undefined()]),
});

export const vParseFailure = v.object({
  success: v.literal(false),
  typed: v.boolean(),
  output: v.unknown(),
  issues: v.pipe(v.array(v.unknown()), vNonEmptyArray()),
  credential_index: v.number(),
  claim_set_index: v.union([v.number(), v.undefined()]),
});

export const vParseResult = v.union([vParseSuccess, vParseFailure]);
