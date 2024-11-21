import * as v from 'valibot';
import type { vJsonRecord } from './u-dcql.js';

export namespace DcqlMdocRepresentation {
  export const vNamespaces = v.record(
    v.string(),
    v.record(v.string(), v.unknown())
  );
  export type NameSpaces = Record<string, Record<string, unknown>>;
  export interface Credential {
    docType: string;
    namespaces: NameSpaces;
  }
}
export type DcqlMdocRepresentation = DcqlMdocRepresentation.Credential;

export namespace DcqlSdJwtVcRepresentation {
  export type Claims = v.InferOutput<typeof vJsonRecord>;
  export interface Credential {
    vct: string;
    claims: Claims;
  }
}
export type DcqlSdJwtVcRepresentation = DcqlSdJwtVcRepresentation.Credential;

export namespace DcqlW3cVcRepresentation {
  export type Claims = v.InferOutput<typeof vJsonRecord>;
  export interface Credential {
    claims: Claims;
  }
}
export type DcqlW3cVcRepresentation = DcqlW3cVcRepresentation.Credential;

export type DcqlCredentialRepresentation =
  | DcqlMdocRepresentation
  | DcqlSdJwtVcRepresentation
  | DcqlW3cVcRepresentation;
