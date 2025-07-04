import * as v from 'valibot'

export namespace DcqlMetaResult {
  export const vMetaSuccessResult = v.object({
    success: v.literal(true),

    // TODO: This needs to be format specific
    output: v.object({
      credential_format: v.string(),
    }),
  })

  export const vMetaFailureResult = v.object({
    success: v.literal(false),
    issues: v.record(v.string(), v.unknown()),
    output: v.unknown(),
  })

  export const vModel = v.union([vMetaSuccessResult, vMetaFailureResult])
  export type Input = v.InferInput<typeof vModel>
  export type Output = v.InferOutput<typeof vModel>
}
export type DcqlMetaResult = DcqlMetaResult.Output
