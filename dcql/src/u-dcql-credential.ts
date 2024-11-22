import * as v from 'valibot';
import { vJsonRecord } from './u-dcql.js';

export namespace DcqlMdocCredential {
  export const vNamespaces = v.record(
    v.string(),
    v.record(v.string(), v.unknown())
  );

  export const vModel = v.object({
    docType: v.string(),
    namespaces: vNamespaces,
  });

  export type Input = v.InferInput<typeof vModel>;
  export type Output = v.InferOutput<typeof vModel>;
  export type NameSpaces = v.InferOutput<typeof vNamespaces>;
  export const parse = (input: Input): Output => {
    return v.parse(vModel, input);
  };
}
export type DcqlMdocCredential = DcqlMdocCredential.Output;

export namespace DcqlSdJwtVcCredential {
  export const vClaims = vJsonRecord;
  export const vModel = v.object({
    vct: v.string(),
    claims: vClaims,
  });
  export type Input = v.InferInput<typeof vModel>;
  export type Output = v.InferOutput<typeof vModel>;
  export const parse = (input: Input): Output => {
    return v.parse(vModel, input);
  };
  export type Claims = Output['claims'];
}
export type DcqlSdJwtVcCredential = DcqlSdJwtVcCredential.Output;

export namespace DcqlW3cVcCredential {
  export const vClaims = vJsonRecord;
  export const vModel = v.object({
    claims: vClaims,
  });
  export type Input = v.InferInput<typeof vModel>;
  export type Output = v.InferOutput<typeof vModel>;
  export const parse = (input: Input): Output => {
    return v.parse(vModel, input);
  };
  export type Claims = Output['claims'];
}
export type DcqlW3cVcCredential = DcqlW3cVcCredential.Output;

export namespace DcqlCredential {
  export const vModel = v.union([
    DcqlMdocCredential.vModel,
    DcqlSdJwtVcCredential.vModel,
    DcqlW3cVcCredential.vModel,
  ]);
  export type Input = v.InferInput<typeof vModel>;
  export type Output = v.InferOutput<typeof vModel>;
  export const parse = (input: Input) => {
    return v.parse(vModel, input);
  };
}
export type DcqlCredential = DcqlCredential.Output;
