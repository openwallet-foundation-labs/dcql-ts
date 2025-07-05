import * as v from 'valibot'
import { vIdString, vJsonRecord, vNonEmptyArray, vStringToJson } from '../u-dcql.js'

export namespace DcqlPresentation {
  const vPresentationEntry = v.union([v.string(), vJsonRecord])

  export const vModel = v.pipe(
    v.union([
      v.record(vIdString, vNonEmptyArray(vPresentationEntry)),
      v.record(
        vIdString,
        // We support presentation entry directly (not as array) to support older draft of DCQL
        vPresentationEntry
      ),
    ]),
    v.description(
      'REQUIRED. This is a JSON-encoded object containing entries where the key is the id value used for a Credential Query in the DCQL query and the value is an array of one or more Presentations that match the respective Credential Query. When multiple is omitted, or set to false, the array MUST contain only one Presentation. There MUST NOT be any entry in the JSON-encoded object for optional Credential Queries when there are no matching Credentials for the respective Credential Query. Each Presentation is represented as a string or object, depending on the format as defined in Appendix B. The same rules as above apply for encoding the Presentations.'
    )
  )

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
