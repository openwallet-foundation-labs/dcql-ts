import * as v from 'valibot';
export const idRegex = /^[a-zA-Z0-9_-]+$/;

export const claimSetIdRegex = /^[a-zA-Z0-9_\-?!]+$/;
export const credentialSetIdRegex = /^[a-zA-Z0-9_\-?]+$/;

export const vCredentialFormat = v.picklist([
  'mso_mdoc',
  'vc+sd-jwt',
  'jwt_vc_json',
  'jwt_vc_json-ld',
]);

export type NonEmpty<T extends unknown[]> = [T[number], ...T];

export namespace Mdoc {
  export type NameSpaces = Record<string, Record<string, unknown>>;
  export interface Credential {
    docType: string;
    namespaces: NameSpaces;
  }
}
export type Mdoc = Mdoc.Credential;

export const getIdMetadata = (credentialId: string) => {
  const isOptional = credentialId.endsWith('?');
  const isRequiredIfPresent = credentialId.endsWith('?!');
  const baseId = isOptional
    ? credentialId.slice(0, -1)
    : isRequiredIfPresent
      ? credentialId.slice(0, -2)
      : credentialId;

  return {
    isOptional,
    isRequiredIfPresent,
    baseId,
  };
};
