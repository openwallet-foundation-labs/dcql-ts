import assert from 'node:assert';
import { describe, it } from 'node:test';
import { DcqlQuery } from './m-dcql-query.js';

/**
 * The following is a non-normative example of a DCQL query that requests
 * a Verifiable Credential in the format mso_mdoc with the claims vehicle_holder and first_name:
 */
const mdocMvrcQuery = {
  credentials: [
    {
      id: 'my_credential',
      format: 'mso_mdoc' as const,
      meta: {
        doctype_value: 'org.iso.7367.1.mVRC',
      },
      claims: [
        {
          namespace: 'org.iso.7367.1',
          claim_name: 'vehicle_holder',
        },
        {
          namespace: 'org.iso.18013.5.1',
          claim_name: 'first_name',
        },
      ],
    },
  ],
} satisfies DcqlQuery.Input;

const mdocMvrc = {
  docType: 'org.iso.7367.1.mVRC',
  namespaces: {
    'org.iso.7367.1': {
      vehicle_holder: 'Martin Auer',
      non_disclosed: 'secret',
    },
    'org.iso.18013.5.1': { first_name: 'Martin Auer' },
  },
};

const exampleMdoc = {
  docType: 'example_doctype',
  namespaces: {
    example_namespaces: {
      example_claim: 'example_value',
    },
  },
};

await describe('credential-parser', async () => {
  await it('mdocMvrc example succeeds', _t => {
    const query = DcqlQuery.parse(mdocMvrcQuery);
    DcqlQuery.validate(query);

    const res = DcqlQuery.query(query, [mdocMvrc]);

    assert(res.areRequiredCredentialsPresent);
    assert.deepStrictEqual(res.query_matches, {
      my_credential: {
        issues: undefined,
        success: true,
        typed: true,
        output: {
          docType: 'org.iso.7367.1.mVRC',
          namespaces: {
            'org.iso.7367.1': { vehicle_holder: 'Martin Auer' },
            'org.iso.18013.5.1': { first_name: 'Martin Auer' },
          },
        },
      },
    });

    console.log(res);
  });

  await it('mdocMvrc example with multiple credentials succeeds', _t => {
    const query = DcqlQuery.parse(mdocMvrcQuery);
    DcqlQuery.validate(query);

    const res = DcqlQuery.query(query, [mdocMvrc, exampleMdoc]);

    assert(res.areRequiredCredentialsPresent);
    assert.deepStrictEqual(res.query_matches, {
      my_credential: {
        issues: undefined,
        success: true,
        typed: true,
        output: {
          docType: 'org.iso.7367.1.mVRC',
          namespaces: {
            'org.iso.7367.1': { vehicle_holder: 'Martin Auer' },
            'org.iso.18013.5.1': { first_name: 'Martin Auer' },
          },
        },
      },
    });

    console.log(res);
  });
});
