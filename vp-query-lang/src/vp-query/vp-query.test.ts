import { describe, it } from 'node:test';
import * as v from 'valibot';
import type { VpQueryResult } from './v-vp-query-result.js';
import { VpQuery } from './v-vp-query.js';

export class ResultBuilder {
  private autoComplete: boolean;
  constructor(private vpQueryResult: VpQueryResult) {
    this.autoComplete = false;
  }

  disableAutoComplete(disabled?: boolean) {
    this.autoComplete = !(disabled ?? true);
  }

  getSolutionSpace() {
    const solutionSpace: {
      credentialSetIndex: number;
      claimSets: {
        claimSetIndex: number;
        credentialIndices: number[];
      }[];
    }[] = [];

    for (const [
      credentialSetIndex,
      credentialSetResults,
    ] of this.vpQueryResult.credential_sets_results.entries()) {
      if (!credentialSetResults.areRequiredCredentialsPresent) continue;

      const claimSets = credentialSetResults.credential_set_result.flatMap(
        credentialSetResultsForCredential => {
          return credentialSetResultsForCredential.claim_sets_results.flatMap(
            (claimSetResults, claimSetIndex) => {
              const credentialIndices = claimSetResults
                .map((claimSetResultForCredential, credentialIndex) =>
                  claimSetResultForCredential.areRequiredClaimsPresent
                    ? credentialIndex
                    : -1
                )
                .filter(index => index !== -1);

              return credentialIndices.length > 0
                ? [{ claimSetIndex, credentialIndices }]
                : [];
            }
          );
        }
      );

      if (claimSets.length > 0) {
        solutionSpace.push({ credentialSetIndex, claimSets });
      }
    }

    return solutionSpace;
  }
}

export const simpleMdoc = {
  credentials: [
    {
      id: 'my_credential',
      format: 'mso_mdoc',
      meta: {
        doctype_values: ['org.iso.7367.1.mVR'],
      },
      claims: [
        {
          id: 'a',
          namespace: 'org.iso.7367.1',
          claim_name: 'vehicle_holder',
        },
        {
          id: 'b',
          namespace: 'org.iso.18013.5.1',
          claim_name: 'first_name',
        },
        {
          id: 'c',
          namespace: 'org.iso.18013.5.1',
          claim_name: 'invalid',
        },
      ],
      claim_sets: [['a'], ['b'], ['c'], ['a', 'b?!']],
    },
    {
      id: 'my_credential2',
      format: 'mso_mdoc',
      meta: {
        doctype_values: ['org.iso.7367.1.mVR'],
      },
      claims: [
        {
          id: 'a',
          namespace: 'org.iso.7367.1',
          claim_name: 'vehicle_holder',
        },
        {
          id: 'b',
          namespace: 'org.iso.18013.5.1',
          claim_name: 'first_name',
        },
        {
          id: 'c',
          namespace: 'org.iso.18013.5.1',
          claim_name: 'invalid',
        },
      ],
      claim_sets: [['a'], ['b'], ['c'], ['a', 'b?!']],
    },
  ],
  credential_sets: [['my_credential?'], ['my_credential']],
} satisfies VpQuery;

const validMdoc = {
  docType: 'org.iso.7367.1.mVR',
  namespaces: {
    'org.iso.7367.1': {
      vehicle_holder: 'Martin Auer',
      non_disclosed: 'secret',
    },

    'org.iso.18013.5.1': {
      first_name: 'Martin Auer',
    },
  },
};

await describe('credential-parser', async () => {
  await it('mdoc-credential-parser', _t => {
    const query = v.parse(VpQuery.vModel, simpleMdoc);
    VpQuery.validate(query);
    const res = VpQuery.query(query, [
      validMdoc,
      {
        docType: 'org.iso.7367.1.mVR',
        namespaces: {
          'org.iso.7367.1': {
            non_disclosed: 'secret',
          },

          'org.iso.18013.5.1': {
            first_name: 'Martin Auer',
          },
        },
      },
      { docType: 'some', namespaces: {} },
    ]);

    console.log(res);
    const builder = new ResultBuilder(res);
    const solutionSpace = builder.getSolutionSpace();
    console.log(solutionSpace);
  });
});
