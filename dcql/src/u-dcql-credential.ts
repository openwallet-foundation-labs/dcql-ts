import * as v from 'valibot';
import { vJsonRecord } from './u-dcql.js';
import type { InferModelTypes } from './u-model';
import { Model } from './u-model.js';

export namespace DcqlMdocCredential {
  export const vNamespaces = v.record(
    v.string(),
    v.record(v.string(), v.unknown())
  );
  export const vModel = v.object({
    credentialFormat: v.literal('mso_mdoc'),
    doctype: v.string(),
    namespaces: vNamespaces,
  });

  export const model = new Model({ vModel });
  export type Model = InferModelTypes<typeof model>;
  export type NameSpaces = v.InferOutput<typeof vNamespaces>;
}
export type DcqlMdocCredential = DcqlMdocCredential.Model['Output'];

export namespace DcqlSdJwtVcCredential {
  export const vClaims = vJsonRecord;
  export const vModel = v.object({
    credentialFormat: v.literal('vc+sd-jwt'),
    vct: v.string(),
    claims: vClaims,
  });
  export const model = new Model({ vModel });
  export type Model = InferModelTypes<typeof model>;
  export type Claims = Model['Output']['claims'];
}
export type DcqlSdJwtVcCredential = DcqlSdJwtVcCredential.Model['Output'];

export namespace DcqlW3cVcCredential {
  export const vClaims = vJsonRecord;
  export const vModel = v.object({
    credentialFormat: v.picklist(['jwt_vc_json-ld', 'jwt_vc_json']),
    claims: vClaims,
  });

  export const model = new Model({ vModel });
  export type Model = InferModelTypes<typeof model>;
  export type Claims = Model['Output']['claims'];
}
export type DcqlW3cVcCredential = DcqlW3cVcCredential.Model['Output'];

export namespace DcqlCredential {
  export const vModel = v.variant('credentialFormat', [
    DcqlMdocCredential.vModel,
    DcqlSdJwtVcCredential.vModel,
    DcqlW3cVcCredential.vModel,
  ]);
  export const model = new Model({ vModel });
  export type Model = InferModelTypes<typeof model>;
}
export type DcqlCredential = DcqlCredential.Model['Output'];
