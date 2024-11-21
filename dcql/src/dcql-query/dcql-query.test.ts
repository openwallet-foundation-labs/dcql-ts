import assert from 'node:assert';
import { describe, it } from 'node:test';
import type {
  DcqlMdocRepresentation,
  DcqlSdJwtVcRepresentation,
} from '../u-dcql-credential-representation.js';
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
} satisfies DcqlMdocRepresentation;

const sdJwtVcExample = {
  credentials: [
    {
      id: 'my_credential',
      format: 'vc+sd-jwt',
      meta: {
        vct_values: ['https://credentials.example.com/identity_credential'],
      },
      claims: [
        { path: ['last_name'] },
        { path: ['first_name'] },
        { path: ['address', 'street_address'] },
      ],
    },
  ],
} satisfies DcqlQuery.Input;

const sdJwtVc = {
  vct: 'https://credentials.example.com/identity_credential',
  claims: {
    first_name: 'Arthur',
    last_name: 'Dent',
    address: {
      street_address: '42 Market Street',
      locality: 'Milliways',
      postal_code: '12345',
    },
    degrees: [
      {
        type: 'Bachelor of Science',
        university: 'University of Betelgeuse',
      },
      {
        type: 'Master of Science',
        university: 'University of Betelgeuse',
      },
    ],
    nationalities: ['British', 'Betelgeusian'],
  },
} satisfies DcqlSdJwtVcRepresentation;

void describe('credential-parser', () => {
  void it('mdocMvrc example succeeds', _t => {
    const query = DcqlQuery.parse(mdocMvrcQuery);
    DcqlQuery.validate(query);

    const res = DcqlQuery.query(query, [mdocMvrc]);
    assert(res.canBeSatisfied);

    assert.deepStrictEqual(res.credential_matches, {
      my_credential: {
        issues: undefined,
        success: true,
        typed: true,
        credential_index: 0,
        claim_set_index: undefined,
        output: {
          docType: 'org.iso.7367.1.mVRC',
          namespaces: {
            'org.iso.7367.1': { vehicle_holder: 'Martin Auer' },
            'org.iso.18013.5.1': { first_name: 'Martin Auer' },
          },
        },

        all: res.credential_matches.my_credential?.all,
      },
    });
  });

  void it('mdocMvrc example with multiple credentials succeeds', _t => {
    const query = DcqlQuery.parse(mdocMvrcQuery);
    DcqlQuery.validate(query);

    const res = DcqlQuery.query(query, [exampleMdoc, mdocMvrc]);

    assert(res.canBeSatisfied);
    assert.deepStrictEqual(res.credential_matches, {
      my_credential: {
        issues: undefined,
        success: true,
        typed: true,
        credential_index: 1,
        claim_set_index: undefined,
        output: {
          docType: 'org.iso.7367.1.mVRC',
          namespaces: {
            'org.iso.7367.1': { vehicle_holder: 'Martin Auer' },
            'org.iso.18013.5.1': { first_name: 'Martin Auer' },
          },
        },
        all: res.credential_matches.my_credential?.all,
      },
    });
  });

  void it('sdJwtVc example with multiple credentials succeeds', _t => {
    const query = DcqlQuery.parse(sdJwtVcExample);
    DcqlQuery.validate(query);

    const res = DcqlQuery.query(query, [exampleMdoc, sdJwtVc]);

    assert(res.canBeSatisfied);
    assert.deepStrictEqual(res.credential_matches, {
      my_credential: {
        issues: undefined,
        success: true,
        typed: true,
        credential_index: 1,
        claim_set_index: undefined,
        output: {
          vct: 'https://credentials.example.com/identity_credential',
          claims: {
            first_name: 'Arthur',
            last_name: 'Dent',
            address: {
              street_address: '42 Market Street',
            },
          },
        },
        all: res.credential_matches.my_credential?.all,
      },
    });
  });
});
