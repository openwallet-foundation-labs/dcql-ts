import * as v from 'valibot';
import {
  DcqlMdocCredential,
  DcqlSdJwtVcCredential,
  DcqlW3cVcCredential,
} from '../u-dcql-credential';
import type { InferModelTypes } from '../u-model';
import { Model } from '../u-model';

export namespace DcqlMdocPresentation {
  export const vModel = DcqlMdocCredential.vModel;
  export const model = new Model({ vModel });
  export type Model = InferModelTypes<typeof model>;
}
export type DcqlMdocPresentation = DcqlMdocPresentation.Model['Output'];

export namespace DcqlSdJwtVcPresentation {
  export const vModel = DcqlSdJwtVcCredential.vModel;
  export const model = new Model({ vModel });
  export type Model = InferModelTypes<typeof model>;
}
export type DcqlSdJwtVcPresentation = DcqlSdJwtVcPresentation.Model['Output'];

export namespace DcqlW3cVcPresentation {
  export const vModel = DcqlW3cVcCredential.vModel;
  export const model = new Model({ vModel });
  export type Model = InferModelTypes<typeof model>;
}
export type DcqlW3cVcPresentation = DcqlW3cVcPresentation.Model['Output'];

export namespace DcqlCredentialPresentation {
  export const model = new Model({
    vModel: v.variant('credential_format', [
      DcqlMdocPresentation.vModel,
      DcqlSdJwtVcPresentation.vModel,
      DcqlW3cVcPresentation.vModel,
    ]),
  });
  export type Model = InferModelTypes<typeof model>;
}
export type DcqlCredentialPresentation =
  DcqlCredentialPresentation.Model['Output'];
