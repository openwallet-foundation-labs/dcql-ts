import * as v from 'valibot'
import { DcqlMdocCredential, DcqlSdJwtVcCredential, DcqlW3cVcCredential } from '../u-dcql-credential'
import type { InferModelTypes } from '../u-model'
import { Model } from '../u-model'

const vBaseModel = v.object({
  /**
   * Whether this presentation includes cryptographic holder binding. This will be checked against
   * the `require_cryptographic_holder_binding` property from the query
   */
  includes_cryptographic_holder_binding: v.pipe(
    v.boolean(),
    v.description(
      'Whether this presentation includes cryptographic holder binding. This will be checked against the `require_cryptographic_holder_binding` property from the query'
    )
  ),
})

export namespace DcqlMdocPresentation {
  export const vModel = v.object({
    ...DcqlMdocCredential.vModel.entries,
    ...vBaseModel.entries,
  })
  export const model = new Model({ vModel })
  export type Model = InferModelTypes<typeof model>
}
export type DcqlMdocPresentation = DcqlMdocPresentation.Model['Output']

export namespace DcqlSdJwtVcPresentation {
  export const vModel = v.object({
    ...DcqlSdJwtVcCredential.vModel.entries,
    ...vBaseModel.entries,
  })
  export const model = new Model({ vModel })
  export type Model = InferModelTypes<typeof model>
}
export type DcqlSdJwtVcPresentation = DcqlSdJwtVcPresentation.Model['Output']

export namespace DcqlW3cVcPresentation {
  export const vModel = v.object({
    ...DcqlW3cVcCredential.vModel.entries,
    ...vBaseModel.entries,
  })
  export const model = new Model({ vModel })
  export type Model = InferModelTypes<typeof model>
}
export type DcqlW3cVcPresentation = DcqlW3cVcPresentation.Model['Output']

export namespace DcqlCredentialPresentation {
  export const model = new Model({
    vModel: v.variant('credential_format', [
      DcqlMdocPresentation.vModel,
      DcqlSdJwtVcPresentation.vModel,
      DcqlW3cVcPresentation.vModel,
    ]),
  })
  export type Model = InferModelTypes<typeof model>
}
export type DcqlCredentialPresentation = DcqlCredentialPresentation.Model['Output']
