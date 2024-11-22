import * as v from 'valibot';

export type UnknownBaseSchema = v.BaseSchema<
  unknown,
  unknown,
  v.BaseIssue<unknown>
>;

type EnsureOutputAssignableToInput<T extends UnknownBaseSchema> =
  v.InferOutput<T> extends v.InferInput<T> ? T : never;

export class Model<T extends UnknownBaseSchema> {
  constructor(private input: { vModel: EnsureOutputAssignableToInput<T> }) {}

  public get v() {
    return this.input.vModel;
  }

  public parse(input: T) {
    return v.parse(this.v, input);
  }

  public is(input: unknown): input is v.InferOutput<T> {
    return v.is(this.v, input);
  }
}

export interface InferModelTypes<V extends UnknownBaseSchema> {
  Input: v.InferInput<V>;
  Output: v.InferOutput<V>;
}
