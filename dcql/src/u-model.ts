import * as v from 'valibot'
import { DcqlParseError } from './dcql-error/e-dcql'

export type UnknownBaseSchema = v.BaseSchema<unknown, unknown, v.BaseIssue<unknown>>

type EnsureOutputAssignableToInput<T extends UnknownBaseSchema> = v.InferOutput<T> extends v.InferInput<T> ? T : never

export class Model<T extends UnknownBaseSchema> {
  constructor(private input: { vModel: EnsureOutputAssignableToInput<T> }) {}

  public get v() {
    return this.input.vModel
  }

  public parse(input: T) {
    const result = this.safeParse(input)

    if (result.success) {
      return result.output
    }

    return new DcqlParseError({
      message: JSON.stringify(result.flattened),
      cause: result.error,
    })
  }

  public safeParse(
    input: unknown
  ):
    | { success: true; output: v.InferOutput<T> }
    | { success: false; flattened: v.FlatErrors<T>; error: v.ValiError<T> } {
    const res = v.safeParse(this.input.vModel, input)
    if (res.success) {
      return { success: true, output: res.output }
    }
    return {
      success: false,
      error: new v.ValiError(res.issues),
      flattened: v.flatten<T>(res.issues),
    }
  }

  public is(input: unknown): input is v.InferOutput<T> {
    return v.is(this.v, input)
  }
}

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export type InferModelTypes<T extends Model<any>> = T extends Model<infer U>
  ? {
      Input: v.InferInput<U>
      Output: v.InferOutput<U>
    }
  : never
