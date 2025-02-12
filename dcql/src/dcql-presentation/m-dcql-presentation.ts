import * as v from 'valibot'
import { vIdString, vJsonRecord, vStringToJson } from '../u-dcql.js'

export namespace DcqlPresentation {
  export const vModel = v.record(vIdString, v.union([v.string(), vJsonRecord]))

  export type Input = v.InferInput<typeof vModel>
  export type Output = v.InferOutput<typeof vModel>
  export const parse = (input: Input | string) => {
    if (typeof input === 'string') {
      return v.parse(v.pipe(v.string(), vStringToJson, vModel), input)
    }

    return v.parse(vModel, input)
  }

  export const encode = (input: Output) => {
    return JSON.stringify(input)
  }
}
export type DcqlPresentation = DcqlPresentation.Output
