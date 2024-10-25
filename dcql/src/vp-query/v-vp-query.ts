import * as v from 'valibot';
import { CredentialQuery } from '../credential-query/v-credential-query.js';
import {
  InvalidCredentialQueryIdError,
  VpQueryCredentialSetError,
  VpQueryNonUniqueCredentialQueryIdsError,
} from '../e-vp-query.js';
import { credentialSetIdRegex, getIdMetadata } from '../u-query.js';
import { queryVerifiablePresentation } from './vp-query.js';

export namespace VpQuery {
  export const vModel = v.object({
    credentials: v.pipe(v.array(CredentialQuery.vModel), v.nonEmpty()),
    credential_sets: v.optional(
      v.pipe(
        v.array(v.array(v.pipe(v.string(), v.regex(credentialSetIdRegex)))),
        v.nonEmpty()
      )
    ),
  });
  export type Input = v.InferInput<typeof vModel>;
  export type Out = v.InferOutput<typeof vModel>;
  export const validate = (vpQuery: Out) => {
    validateUniqueCredentialQueryIds(vpQuery);
    validateCredentialSets(vpQuery);
  };
  export const query = queryVerifiablePresentation;
}
export type VpQuery = VpQuery.Out;

// --- validations --- //

const validateUniqueCredentialQueryIds = (query: VpQuery.Out) => {
  const ids = query.credentials.map(c => c.id);
  const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);

  if (duplicates.length > 0) {
    throw new VpQueryNonUniqueCredentialQueryIdsError({
      message: `Duplicate credential query ids found: ${duplicates.join(', ')}`,
    });
  }
};

const validateCredentialSets = (query: VpQuery.Out) => {
  if (!query.credential_sets) return;

  const credentialIds = new Set(query.credentials.map(c => c.id));
  const undefinedCredentials: string[] = [];
  for (const credential_set of query.credential_sets) {
    for (const credential_id of credential_set) {
      const { baseId, isRequiredIfPresent } = getIdMetadata(credential_id);

      if (isRequiredIfPresent) {
        throw new InvalidCredentialQueryIdError({
          message:
            'Invalid credential-query id. Required if present operator can only be applied to credential queries.',
        });
      }

      if (!credentialIds.has(baseId)) {
        undefinedCredentials.push(credential_id);
      }
    }
  }

  if (undefinedCredentials.length > 1) {
    throw new VpQueryCredentialSetError({
      message: `Credential set contains undefined credential id${undefinedCredentials.length === 1 ? '' : '`s'} '${undefinedCredentials.join(', ')}'`,
    });
  }
};
