import * as v from 'valibot'
import type { UnknownBaseSchema } from './u-model'
export const idRegex = /^[a-zA-Z0-9_-]+$/

// biome-ignore lint/suspicious/noExplicitAny: we want to allow any schema here
export type vBaseSchemaAny = v.BaseSchema<any, any, any>

export function asNonEmptyArrayOrUndefined<U>(array: U[]): NonEmptyArray<U> | undefined {
  return array.length > 0 ? (array as NonEmptyArray<U>) : undefined
}

export function isNonEmptyArray<U>(array: U[]): array is NonEmptyArray<U> {
  return array.length > 0
}

export type NonEmptyArray<T> = [T, ...T[]]
export type ToNonEmptyArray<T extends Array<unknown>> = [T[number], ...T]
export const vNonEmptyArray = <const TItem extends v.BaseSchema<unknown, unknown, v.BaseIssue<unknown>>>(
  item: TItem
) => {
  return v.pipe(
    v.array(item, (i) => `Expected input to be an array, but received '${i.received}'`),
    v.custom<NonEmptyArray<v.InferOutput<TItem>>>(
      (input) => (input as TItem[]).length > 0,
      'Array must be non-empty and have length of at least 1'
    )
  )
}

export const vIncludesAll = <T extends unknown[]>(subset: T) => {
  return v.custom<T>(
    (value) => {
      if (!Array.isArray(value)) return false

      // Check if all elements from the subset are in the value array
      return subset.every((item) => value.includes(item))
    },
    `Value must include all of: ${subset.join(', ')}`
  )
}

export const vIdString = v.pipe(v.string(), v.regex(idRegex), v.nonEmpty())
export const vBase64url = v.regex(/^(?:[\w-]{4})*(?:[\w-]{2}(?:==)?|[\w-]{3}=?)?$/iu, 'must be base64url')

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

interface HasToJson {
  toJson(): Json
}

function isToJsonable(value: unknown): value is HasToJson {
  if (value === null || typeof value !== 'object') return false

  // biome-ignore lint/suspicious/noExplicitAny: no explanation
  const toJsonFn = (value as any).toJson
  return typeof toJsonFn === 'function'
}

export const vWithJT = <Schema extends UnknownBaseSchema>(schema: Schema) =>
  v.pipe(
    v.custom<v.InferInput<Schema>>(() => true),
    v.rawTransform<v.InferInput<Schema>, v.InferOutput<Schema>>(({ dataset, addIssue, NEVER }) => {
      const result = v.safeParse(schema, dataset.value)
      if (result.success) return dataset.value

      if (!isToJsonable(dataset.value)) {
        for (const safeParseIssue of result.issues) {
          addIssue({
            ...safeParseIssue,
            expected: safeParseIssue.expected ?? undefined,
          })
        }

        return NEVER
      }

      let json: Json

      try {
        json = dataset.value.toJson()
      } catch (_error) {
        for (const safeParseIssue of result.issues) {
          addIssue({
            ...safeParseIssue,
            expected: safeParseIssue.expected ?? undefined,
          })
        }
        addIssue({ message: 'Json Transformation failed' })
        return NEVER
      }

      const safeParseResult: v.SafeParseResult<Schema> = v.safeParse(schema, json)
      if (safeParseResult.success) return dataset.value

      for (const safeParseIssue of safeParseResult.issues) {
        addIssue({
          ...safeParseIssue,
          expected: safeParseIssue.expected ?? undefined,
        })
      }

      return NEVER
    })
  )

export const vJsonLiteral = v.union([v.string(), v.number(), v.boolean(), v.null()])

export type JsonLiteral = v.InferOutput<typeof vJsonLiteral>

export const vJson: v.GenericSchema<Json> = v.lazy(() =>
  v.union([vJsonLiteral, v.array(vJson), v.record(v.string(), vJson)])
)

export const vJsonWithJT: v.GenericSchema<Json> = v.lazy(() =>
  vWithJT(v.union([vJsonLiteral, v.array(vJson), v.record(v.string(), vJson)]))
)

export const vJsonRecord = v.record(v.string(), vJson)
export type JsonRecord = v.InferOutput<typeof vJsonRecord>

export const vStringToJson = v.rawTransform<string, Json>(({ dataset, addIssue, NEVER }) => {
  try {
    return JSON.parse(dataset.value) as Json
  } catch (_error) {
    addIssue({ message: 'Invalid JSON' })
    return NEVER
  }
})
