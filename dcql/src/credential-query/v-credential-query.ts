import * as v from 'valibot';
import { ClaimsQuery } from '../claims-query/v-claims-query.js';
import { VpQueryUndefinedClaimSetIdError } from '../e-vp-query.js';
import { claimSetIdRegex, getIdMetadata, idRegex } from '../u-query.js';

export namespace CredentialQuery {
  export const vMdoc = v.object({
    id: v.pipe(v.string(), v.regex(idRegex)),
    format: v.literal('mso_mdoc'),
    meta: v.optional(
      v.object({
        doctype_values: v.optional(v.array(v.string())),
      })
    ),
    claims: v.optional(v.pipe(v.array(ClaimsQuery.vMdoc), v.nonEmpty())),
    claim_sets: v.optional(
      v.pipe(
        v.array(v.array(v.pipe(v.string(), v.regex(claimSetIdRegex)))),
        v.nonEmpty()
      )
    ),
  });
  export type Mdoc = v.InferOutput<typeof vMdoc>;

  const vW3cSdJwtVcBase = v.object({
    id: v.pipe(v.string(), v.regex(idRegex)),
    claims: v.optional(v.pipe(v.array(ClaimsQuery.vW3cSdJwtVc), v.nonEmpty())),
    claim_sets: v.optional(
      v.pipe(
        v.array(v.array(v.pipe(v.string(), v.regex(claimSetIdRegex)))),
        v.nonEmpty()
      )
    ),
  });

  export const vSdJwtVc = v.object({
    ...vW3cSdJwtVcBase.entries,
    format: v.literal('vc+sd-jwt'),
    meta: v.optional(
      v.object({
        vct_values: v.optional(v.array(v.string())),
      })
    ),
  });
  export type SdJwtVc = v.InferOutput<typeof vSdJwtVc>;

  export const vW3c = v.object({
    ...vW3cSdJwtVcBase.entries,
    format: v.picklist(['jwt_vc_json', 'jwt_vc_json-ld']),
  });
  export type W3c = v.InferOutput<typeof vW3c>;

  export const vModel = v.variant('format', [vMdoc, vSdJwtVc, vW3c]);
  export type Input = v.InferInput<typeof vModel>;
  export type Out = v.InferInput<typeof vModel>;

  export const validate = (credentialQuery: Out) => {
    claimSetIdsAreDefined(credentialQuery);
  };
}
export type CredentialQuery = CredentialQuery.Out;

// --- validations --- //

const claimSetIdsAreDefined = (credentialQuery: CredentialQuery) => {
  if (!credentialQuery.claim_sets) return;
  const claimIds = new Set(credentialQuery.claims?.map(c => c.id));

  const undefinedClaims: string[] = [];
  for (const claim_set of credentialQuery.claim_sets) {
    for (const claim_id of claim_set) {
      const { baseId } = getIdMetadata(claim_id);

      if (!claimIds.has(baseId)) {
        undefinedClaims.push(baseId);
      }
    }
  }

  if (undefinedClaims.length > 1) {
    throw new VpQueryUndefinedClaimSetIdError({
      message: `Credential set contains undefined credential id${undefinedClaims.length === 0 ? '' : '`s'} '${undefinedClaims.join(', ')}'`,
    });
  }
};
