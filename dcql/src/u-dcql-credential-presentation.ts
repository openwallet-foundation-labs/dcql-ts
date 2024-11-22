import * as v from 'valibot';
import type { InferModelTypes } from './model';
import { Model } from './model';
import {
  DcqlMdocCredential,
  DcqlSdJwtVcCredential,
  DcqlW3cVcCredential,
} from './u-dcql-credential';

export namespace DcqlMdocPresentation {
  export const model = new Model({ vModel: DcqlMdocCredential.vModel });
  export type Model = InferModelTypes<typeof model>;
}
export type DcqlMdocPresentation = DcqlMdocPresentation.Model['Output'];

export namespace DcqlSdJwtVcPresentation {
  export const model = new Model({ vModel: DcqlSdJwtVcCredential.vModel });
  export type Model = InferModelTypes<typeof model>;
}
export type DcqlSdJwtVcPresentation = DcqlSdJwtVcPresentation.Model['Output'];

export namespace DcqlW3cVcPresentation {
  export const model = new Model({ vModel: DcqlW3cVcCredential.vModel });
  export type Model = InferModelTypes<typeof model>;
}
export type DcqlW3cVcPresentation = DcqlW3cVcPresentation.Model['Output'];

export namespace DcqlCredentialPresentation {
  export const model = new Model({
    vModel: v.union([
      DcqlMdocPresentation.model.v,
      DcqlSdJwtVcPresentation.model.v,
      DcqlW3cVcPresentation.model.v,
    ]),
  });
  export type Model = InferModelTypes<typeof model>;
}
export type DcqlCredentialPresentation =
  DcqlCredentialPresentation.Model['Output'];
