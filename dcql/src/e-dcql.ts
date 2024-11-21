import { DcqlError } from './e-base.js';

export class DcqlCredentialSetError extends DcqlError {
  constructor(opts: { message: string; cause?: unknown }) {
    super({ code: 'BAD_REQUEST', ...opts });
  }
}

export class DcqlUndefinedClaimSetIdError extends DcqlError {
  constructor(opts: { message: string; cause?: unknown }) {
    super({ code: 'BAD_REQUEST', ...opts });
  }
}

export class DcqlNonUniqueCredentialQueryIdsError extends DcqlError {
  constructor(opts: { message: string; cause?: unknown }) {
    super({ code: 'BAD_REQUEST', ...opts });
  }
}

export class DcqlInvalidClaimsQueryIdError extends DcqlError {
  constructor(opts: { message: string; cause?: unknown }) {
    super({ code: 'BAD_REQUEST', ...opts });
  }
}

export class DcqlEmptyPresentationRecordError extends DcqlError {
  constructor(opts: { message: string; cause?: unknown }) {
    super({ code: 'BAD_REQUEST', ...opts });
  }
}

export class DcqlMissingClaimSetParseError extends DcqlError {
  constructor(opts: { message: string; cause?: unknown }) {
    super({ code: 'BAD_REQUEST', ...opts });
  }
}

export class DcqlInvalidPresentationRecordError extends DcqlError {
  constructor(opts: { message: string; cause?: unknown }) {
    super({ code: 'BAD_REQUEST', ...opts });
  }
}
