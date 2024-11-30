import assert from 'node:assert';
import { describe, it } from 'node:test';
import { DcqlPresentationResult } from '../dcql-presentation/m-dcql-presentation-result.js';
import type {
  DcqlMdocCredential,
  DcqlSdJwtVcCredential,
} from '../u-dcql-credential.js';
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
} satisfies DcqlQuery;

const sdJwtVcExampleQuery = {
  credentials: [
    {
      id: 'my_credential',
      format: 'dc+sd-jwt',
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
} satisfies DcqlQuery;

class ValueClass {
  constructor(private value: unknown) {}
  toJson() {
    return this.value;
  }
}

const mdocWithJT = {
  credential_format: 'mso_mdoc',
  doctype: 'org.iso.7367.1.mVRC',
  namespaces: {
    'org.iso.7367.1': {
      vehicle_holder: 'Martin Auer',
      non_disclosed: 'secret',
    },
    'org.iso.18013.5.1': { first_name: new ValueClass('Martin Auer') },
  },
} satisfies DcqlMdocCredential;

const sdJwtVcWithJT = {
  credential_format: 'dc+sd-jwt',
  vct: 'https://credentials.example.com/identity_credential',
  claims: {
    first_name: 'Arthur',
    last_name: 'Dent',
    // @ts-expect-error ValueClass is not a valid type
    address: {
      street_address: new ValueClass('42 Market Street'),
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
} satisfies DcqlSdJwtVcCredential;

void describe('dcql-query-with-json-transform', () => {
  void it('mdocMvrc example succeeds (with-json-transform)', _t => {
    const query = DcqlQuery.parse(mdocMvrcQuery);
    DcqlQuery.validate(query);

    const credentials = [mdocWithJT];
    const res = DcqlQuery.query(query, credentials);

    assert(res.canBeSatisfied);

    assert.deepStrictEqual(res.credential_matches, {
      my_credential: {
        success: true,
        typed: true,
        input_credential_index: 0,
        claim_set_index: undefined,
        output: {
          credential_format: 'mso_mdoc' as const,
          doctype: 'org.iso.7367.1.mVRC',
          namespaces: {
            'org.iso.7367.1': { vehicle_holder: 'Martin Auer' },
            'org.iso.18013.5.1': { first_name: new ValueClass('Martin Auer') },
          },
        },

        all: res.credential_matches.my_credential?.all,
      },
    });

    const presentationQueryResult = DcqlPresentationResult.fromDcqlPresentation(
      { my_credential: res.credential_matches.my_credential.output },
      { dcqlQuery: query }
    );

    assert.deepStrictEqual(presentationQueryResult.valid_matches, {
      my_credential: {
        success: true,
        typed: true,
        presentation_id: 'my_credential',
        claim_set_index: undefined,
        output: {
          credential_format: 'mso_mdoc' as const,
          doctype: 'org.iso.7367.1.mVRC',
          namespaces: {
            'org.iso.7367.1': { vehicle_holder: 'Martin Auer' },
            'org.iso.18013.5.1': { first_name: new ValueClass('Martin Auer') },
          },
        },
      },
    });
  });

  void it('sdJwtVc example with multiple credentials succeeds', _t => {
    const query = DcqlQuery.parse(sdJwtVcExampleQuery);
    DcqlQuery.validate(query);

    // @ts-expect-error ValueClass is not a valid type
    const res = DcqlQuery.query(query, [mdocWithJT, sdJwtVcWithJT]);

    assert(res.canBeSatisfied);
    assert.deepStrictEqual(res.credential_matches, {
      my_credential: {
        success: true,
        typed: true,
        input_credential_index: 1,
        claim_set_index: undefined,
        output: {
          credential_format: 'dc+sd-jwt' as const,
          vct: 'https://credentials.example.com/identity_credential',
          claims: {
            first_name: 'Arthur',
            last_name: 'Dent',
            address: {
              street_address: new ValueClass('42 Market Street'),
            },
          },
        },
        all: res.credential_matches.my_credential?.all,
      },
    });

    const presentationQueryResult = DcqlPresentationResult.fromDcqlPresentation(
      // @ts-expect-error ValueClass is not a valid type
      { my_credential: res.credential_matches.my_credential.output },
      { dcqlQuery: query }
    );

    assert.deepStrictEqual(presentationQueryResult.valid_matches, {
      my_credential: {
        success: true,
        typed: true,
        presentation_id: 'my_credential',
        claim_set_index: undefined,
        output: {
          credential_format: 'dc+sd-jwt' as const,
          vct: 'https://credentials.example.com/identity_credential',
          claims: {
            first_name: 'Arthur',
            last_name: 'Dent',
            address: {
              street_address: new ValueClass('42 Market Street'),
            },
          },
        },
      },
    });
  });
});
