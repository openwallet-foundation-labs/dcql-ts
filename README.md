# Digital Credentials Query Language (DCQL)

The Digital Credentials Query Language (DCQL, pronounced [ˈdakl̩]) is a
JSON-encoded query language that allows the Verifier to request Verifiable
Presentations that match the query. The Verifier MAY encode constraints on the
combinations of credentials and claims that are requested. The Wallet evaluates
the query against the Verifiable Credentials it holds and returns Verifiable
Presentations matching the query.

`credentials`:
: REQUIRED. A non-empty array of Credential Queries as defined in (#credential_query)
that specify the requested Verifiable Credentials.
`credential_sets`:
: OPTIONAL. A non-empty array of credential set queries as defined in (#credential_set_query)
that specifies additional constraints on which of the requested Verifiable Credentials to return.
