import * as v from 'valibot';
import {
  DcqlCredentialSetError,
  DcqlNonUniqueCredentialQueryIdsError,
} from '../e-dcql.js';
import { vNonEmptyArray } from '../u-dcql.js';
import { performDcqlQuery } from './dcql-query.js';
import { DcqlCredentialQuery } from './m-dcql-credential-query.js';
import { CredentialSetQuery } from './m-dcql-credential-set-query.js';

/**
 * The Digital Credentials Query Language (DCQL, pronounced [ˈdakl̩]) is a
 * JSON-encoded query language that allows the Verifier to request Verifiable
 * Presentations that match the query. The Verifier MAY encode constraints on the
 * combinations of credentials and claims that are requested. The Wallet evaluates
 * the query against the Verifiable Credentials it holds and returns Verifiable
 * Presentations matching the query.
 */
export namespace DcqlQuery {
  export const vModel = v.object({
    credentials: v.pipe(
      v.array(DcqlCredentialQuery.vModel),
      vNonEmptyArray(),
      v.description(
        `REQUIRED. A non-empty array of Credential Queries that specify the requested Verifiable Credentials.`
      )
    ),
    credential_sets: v.pipe(
      v.optional(v.pipe(v.array(CredentialSetQuery.vModel), vNonEmptyArray())),
      v.description(
        `OPTIONAL. A non-empty array of credential set queries that specifies additional constraints on which of the requested Verifiable Credentials to return.`
      )
    ),
  });
  export type Input = v.InferInput<typeof vModel>;
  export type Output = v.InferOutput<typeof vModel>;
  export const validate = (dcqlQuery: Output) => {
    validateUniqueCredentialQueryIds(dcqlQuery);
    validateCredentialSets(dcqlQuery);
    dcqlQuery.credentials.forEach(DcqlCredentialQuery.validate);
  };
  export const query = performDcqlQuery;

  export const parse = (input: Input) => {
    const parsed = v.parse(vModel, input);
    validate(parsed);
    return parsed;
  };
}
export type DcqlQuery = DcqlQuery.Output;

// --- validations --- //

const validateUniqueCredentialQueryIds = (query: DcqlQuery.Output) => {
  const ids = query.credentials.map(c => c.id);
  const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);

  if (duplicates.length > 0) {
    throw new DcqlNonUniqueCredentialQueryIdsError({
      message: `Duplicate credential query ids found: ${duplicates.join(', ')}`,
    });
  }
};

const validateCredentialSets = (query: DcqlQuery.Output) => {
  if (!query.credential_sets) return;

  const credentialQueryIds = new Set(query.credentials.map(c => c.id));

  const undefinedCredentialQueryIds: string[] = [];
  for (const credential_set of query.credential_sets) {
    for (const credentialSetOption of credential_set.options) {
      for (const credentialQueryId of credentialSetOption) {
        if (!credentialQueryIds.has(credentialQueryId)) {
          undefinedCredentialQueryIds.push(credentialQueryId);
        }
      }
    }
  }

  if (undefinedCredentialQueryIds.length > 0) {
    throw new DcqlCredentialSetError({
      message: `Credential set contains undefined credential id${undefinedCredentialQueryIds.length === 1 ? '' : '`s'} '${undefinedCredentialQueryIds.join(', ')}'`,
    });
  }
};
