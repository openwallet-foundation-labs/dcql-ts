import { VpQueryError } from './e-base.js';

export class VpQueryCredentialSetError extends VpQueryError {
  constructor(opts: { message: string; cause?: unknown }) {
    super({ code: 'BAD_REQUEST', ...opts });
  }
}

export class VpQueryUndefinedClaimSetIdError extends VpQueryError {
  constructor(opts: { message: string; cause?: unknown }) {
    super({ code: 'BAD_REQUEST', ...opts });
  }
}

export class VpQueryNonUniqueCredentialQueryIdsError extends VpQueryError {
  constructor(opts: { message: string; cause?: unknown }) {
    super({ code: 'BAD_REQUEST', ...opts });
  }
}

export class InvalidClaimsQueryIdError extends VpQueryError {
  constructor(opts: { message: string; cause?: unknown }) {
    super({ code: 'BAD_REQUEST', ...opts });
  }
}

export class InvalidCredentialQueryIdError extends VpQueryError {
  constructor(opts: { message: string; cause?: unknown }) {
    super({ code: 'BAD_REQUEST', ...opts });
  }
}
