import * as v from 'valibot'
import { DcqlMdocCredential, DcqlSdJwtVcCredential, DcqlW3cVcCredential } from '../u-dcql-credential'

export namespace DcqlMetaResult {
  export const vMetaSuccessResult = v.object({
    success: v.literal(true),

    output: v.variant('credential_format', [
      v.pick(DcqlSdJwtVcCredential.vModel, ['credential_format', 'cryptographic_holder_binding', 'vct']),
      v.pick(DcqlMdocCredential.vModel, ['credential_format', 'cryptographic_holder_binding', 'doctype']),
      v.pick(DcqlW3cVcCredential.vModel, ['credential_format', 'cryptographic_holder_binding', 'type']),
    ]),
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
