import type { VpQuery } from './v-vp-query.js';

export const simple: VpQuery = {
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
};

export const matchingSimple: VpQuery = {
  credentials: [
    {
      id: 'my_credential',
      format: 'vc+sd-jwt',
      meta: {
        vct_values: ['https://credentials.example.com/identity_credential'],
      },
      claims: [
        {
          path: ['last_name'],
          values: ['Doe'],
        },
        { path: ['first_name'] },
        { path: ['address', 'street_address'] },
        {
          path: ['postal_code'],
          values: ['90210', '90211'],
        },
      ],
    },
  ],
};

export const multiCredentials: VpQuery = {
  credentials: [
    {
      id: 'pid',
      format: 'vc+sd-jwt',
      meta: {
        vct_values: ['https://credentials.example.com/identity_credential'],
      },
      claims: [
        { path: ['given_name'] },
        { path: ['family_name'] },
        { path: ['address', 'street_address'] },
      ],
    },
    {
      id: 'mdl',
      format: 'mso_mdoc',
      meta: {
        doctype_values: ['org.iso.7367.1.mVR'],
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
};

export const credentialAlternatives: VpQuery = {
  credentials: [
    {
      id: 'pid',
      format: 'vc+sd-jwt',
      meta: {
        vct_values: ['https://credentials.example.com/identity_credential'],
      },
      claims: [
        { path: ['given_name'] },
        { path: ['family_name'] },
        { path: ['address', 'street_address'] },
      ],
    },
    {
      id: 'other_pid',
      format: 'vc+sd-jwt',
      meta: {
        vct_values: ['https://othercredentials.example/pid'],
      },
      claims: [
        { path: ['given_name'] },
        { path: ['family_name'] },
        { path: ['address', 'street_address'] },
      ],
    },
    {
      id: 'pid_reduced_cred_1',
      format: 'vc+sd-jwt',
      meta: {
        vct_values: [
          'https://credentials.example.com/reduced_identity_credential',
        ],
      },
      claims: [{ path: ['family_name'] }, { path: ['given_name'] }],
    },
    {
      id: 'pid_reduced_cred_2',
      format: 'vc+sd-jwt',
      meta: {
        vct_values: ['https://cred.example/residence_credential'],
      },
      claims: [
        { path: ['postal_code'] },
        { path: ['locality'] },
        { path: ['region'] },
      ],
    },
    {
      id: 'nice_to_have',
      format: 'vc+sd-jwt',
      meta: {
        vct_values: ['https://company.example/company_rewards'],
      },
      claims: [
        { id: 'current', path: ['rewards_number'] },
        { id: 'legacy', path: ['legacy_system_rewards_number'] },
      ],
      claim_sets: [['current', 'legacy?']],
    },
  ],
  credential_sets: [
    // deliver the pid, or the other_pid, or both pid_reduced_cred1 + 2; nice_to_have is optional in all cases
    ['pid', 'nice_to_have?'],
    ['other_pid', 'nice_to_have?'],
    ['pid_reduced_cred_1', 'pid_reduced_cred_2', 'nice_to_have?'],
  ],
};

export const claimAlternatives: VpQuery = {
  credentials: [
    {
      id: 'pid',
      format: 'vc+sd-jwt',
      meta: {
        vct_values: ['https://credentials.example.com/identity_credential'],
      },
      // Comments in JSON to be removed before merging PR, they are just here to make Brian less sad
      claims: [
        // define claims, may add other properties like a purpose to each claims
        {
          id: 'a', // required for use in claim_sets below; if that is omitted, the id is optional
          path: ['last_name'],
        },
        { id: 'b', path: ['postal_code'] },
        { id: 'c', path: ['locality'] },
        { id: 'd', path: ['region'] },
        { id: 'e', path: ['date_of_birth'] },
        { id: 'f', path: ['email'] },
      ],
      claim_sets: [
        // defines the rules
        // postal code or (locality and region), last_name, and date_of_birth are mandatory; email is optional
        ['a', 'b', 'e', 'f?'],
        ['a', 'c', 'd', 'e', 'f?'],

        // Note: the ? to mark a claim as optional is syntactical sugar; the rules could be rewritten without it, but that would require a lot of repetition
      ],
    },
  ],
};
