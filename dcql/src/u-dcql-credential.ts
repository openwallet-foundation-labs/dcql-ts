import * as v from 'valibot'
import { DcqlCredentialTrustedAuthority } from './dcql-query/m-dcql-trusted-authorities.js'
import { vJsonRecord } from './u-dcql.js'
import type { InferModelTypes } from './u-model.js'
import { ModelDefinition } from './u-model.js'

const vCredentialModelBase = v.object({
  authority: v.optional(DcqlCredentialTrustedAuthority.vModel),

  /**
   * Indicates support/inclusion of cryptographic holder binding. This will be checked against
   * the `require_cryptographic_holder_binding` property from the query.
   *
   * In the context of a presentation this value means whether the presentation is created
   * with cryptograhpic holder hinding. In the context of a credential query this means whether
   * the credential supports cryptographic holder binding.
   */
  cryptographic_holder_binding: v.pipe(
    v.boolean(),
    v.description(
      'Indicates support/inclusion of cryptographic holder binding. This will be checked against the `require_cryptographic_holder_binding` property from the query.'
    )
  ),
})

export namespace DcqlMdocCredential {
  export const vNamespaces = v.record(v.string(), v.record(v.string(), v.unknown()))
  export const vModel = v.object({
    ...vCredentialModelBase.entries,
    credential_format: v.literal('mso_mdoc'),
    doctype: v.string(),
    namespaces: vNamespaces,
  })

  export const model = new ModelDefinition({ vModel })
  export type Model = InferModelTypes<typeof model>
  export type NameSpaces = v.InferOutput<typeof vNamespaces>
}
export type DcqlMdocCredential = DcqlMdocCredential.Model['Output']

export namespace DcqlSdJwtVcCredential {
  export const vClaims = vJsonRecord
  export const vModel = v.object({
    ...vCredentialModelBase.entries,
    credential_format: v.picklist(['vc+sd-jwt', 'dc+sd-jwt']),
    vct: v.string(),
    claims: vClaims,
  })
  export const model = new ModelDefinition({ vModel })
  export type Model = InferModelTypes<typeof model>
  export type Claims = Model['Output']['claims']
}
export type DcqlSdJwtVcCredential = DcqlSdJwtVcCredential.Model['Output']

export namespace DcqlW3cVcCredential {
  export const vClaims = vJsonRecord
  export const vModel = v.object({
    ...vCredentialModelBase.entries,
    credential_format: v.picklist(['ldp_vc', 'jwt_vc_json']),
    claims: vClaims,
    type: v.array(v.string()),
  })

  export const model = new ModelDefinition({ vModel })
  export type Model = InferModelTypes<typeof model>
  export type Claims = Model['Output']['claims']
}
export type DcqlW3cVcCredential = DcqlW3cVcCredential.Model['Output']

export namespace DcqlCredential {
  export const vModel = v.variant('credential_format', [
    DcqlMdocCredential.vModel,
    DcqlSdJwtVcCredential.vModel,
    DcqlW3cVcCredential.vModel,
  ])

  export const model = new ModelDefinition({ vModel })
  export type Model = InferModelTypes<typeof model>
}
export type DcqlCredential = DcqlCredential.Model['Output']
