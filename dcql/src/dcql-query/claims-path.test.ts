import assert from 'node:assert';
import { describe, it } from 'node:test';
import * as v from 'valibot';
import { getJsonClaimsParser } from '../dcql-query-result/dcql-claims-query-result.js';

const claimsPathPointerExample = {
  name: 'Arthur Dent',
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
};

void describe('claims-path', () => {
  void it('name', _t => {
    const parser = getJsonClaimsParser([{ path: ['name'] }]);
    const res = v.parse(parser, claimsPathPointerExample);

    assert.deepStrictEqual(res, {
      name: 'Arthur Dent',
    });
  });

  void it('address', _t => {
    const parser = getJsonClaimsParser([{ path: ['address'] }]);
    const res = v.parse(parser, claimsPathPointerExample);

    assert.deepStrictEqual(res, {
      address: {
        street_address: '42 Market Street',
        locality: 'Milliways',
        postal_code: '12345',
      },
    });
  });

  void it('address street address', _t => {
    const parser = getJsonClaimsParser([
      { path: ['address', 'street_address'] },
    ]);
    const res = v.parse(parser, claimsPathPointerExample);

    assert.deepStrictEqual(res, {
      address: {
        street_address: '42 Market Street',
      },
    });
  });

  void it('nationalities', _t => {
    const parser = getJsonClaimsParser([{ path: ['nationalities', 1] }]);
    const res = v.parse(parser, claimsPathPointerExample);

    assert.deepStrictEqual(res, {
      nationalities: 'Betelgeusian',
    });
  });

  void it('all degree types', _t => {
    const parser = getJsonClaimsParser([{ path: ['degrees', null, 'type'] }]);
    const res = v.parse(parser, claimsPathPointerExample);

    assert.deepStrictEqual(res, {
      degrees: [{ type: 'Bachelor of Science' }, { type: 'Master of Science' }],
    });
  });
});
