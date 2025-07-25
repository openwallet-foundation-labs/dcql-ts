# DCQL (Digital Credentials Query Language)

A TypeScript implementation of the Digital Credentials Query Language (DCQL, pronounced [ˈdakl̩]) - a JSON-encoded query language for requesting and validating Verifiable Presentations.

## Overview

DCQL enables Verifiers to request Verifiable Presentations that match specific queries. The library provides functionality to:
- Create and validate DCQL queries
- Match queries against Verifiable Credentials
- Validate presentation results
- Handle various credential formats including mso_mdoc, dc+sd-jwt and w3c vc's.
- Create and parse DCQL queries from OID4VP Draft 22 up to version 1.0.

## Installation

```bash
npm install dcql
# or
yarn add dcql
# or
pnpm add dcql
```

## Quick Start

```typescript
import { DcqlQuery, type DcqlCredential } from 'dcql'

const credentials = [
  {
    credential_format: 'mso_mdoc',
    doctype: 'org.iso.7367.1.mVRC',
    cryptographic_holder_binding: true,
    namespaces: {
      'org.iso.7367.1': {
        vehicle_holder: 'John Doe',
      },
      'org.iso.18013.5.1': {
        first_name: 'John',
      },
    },
    authority: {
      type: 'aki',
      values: ['21cbb5a0-9d1e-46dc-b8aa-0e85036af442'],
    },
  },
] satisfies DcqlCredential[]

// Create a DCQL query
const query = {
  credentials: [
    {
      id: 'my_credential',
      format: 'mso_mdoc',
      meta: { doctype_value: 'org.iso.7367.1.mVRC' },
      claims: [
        {
          path: ['org.iso.7367.1', 'vehicle_holder'],
          intent_to_retain: true,
        },
        {
          path: ['org.iso.18013.5.1', 'first_name'],
        },
      ],
    },
  ],
} satisfies DcqlQuery.Input

// Parse (structural) and validate (content) the query
const parsedQuery = DcqlQuery.parse(query)
DcqlQuery.validate(parsedQuery)

// Execute the query against credentials
const queryResult = DcqlQuery.query(parsedQuery, credentials)
```

## Features

- **Query Construction**: Build structured DCQL queries with type safety
- **Validation**: Comprehensive query validation and parsing
- **Credential Matching**: Match credentials against query requirements
- **Result Processing**: Process and validate presentation results
- **Type Safety**: Full TypeScript support with detailed type definitions
- **Format Support**: Support for multiple credential formats
- **Extensible**: Easy to extend for custom credential formats

## Query Result Structure

The query result provides detailed information about the match:

```typescript
// Execute the query against credentials
const queryResult = DcqlQuery.query(parsedQuery, credentials)

// Check if query can be satisfied
console.log(queryResult.can_be_satisfied)

// Access matched credentials
console.log(queryResult.credential_matches)

// The result of a specific credential query
const credentialMatch = queryResult.credential_matches.credential_query_id
console.log(credentialMatch.success) // True if the query is fulfillable
```

## Validating Presentations

Validate presentation results against queries:

```ts
const presentationQueryResult = DcqlPresentationResult.fromDcqlPresentation(
  {
    my_credential: [
      {
        credential_format: 'mso_mdoc',
        doctype: 'org.iso.7367.1.mVRC',
        namespaces: {
          'org.iso.7367.1': { vehicle_holder: 'Martin Auer' },
          'org.iso.18013.5.1': { first_name: 'Martin Auer' },
        },
        cryptographic_holder_binding: true,
      },
    ],
  },
  { dcqlQuery: parsedQuery }
)
```
