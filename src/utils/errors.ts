/* eslint-disable max-classes-per-file */
import { isBoolean, isNumber, isString } from './guards';

export class ScopedError extends Error {
  scope: string;
  private originalMessage: string | undefined;

  constructor(scope: string, error?: unknown) {
    let overriddenScope = scope;
    let originalMessage: string | undefined;
    let cause: unknown = undefined;

    if (error instanceof ScopedError) {
      overriddenScope = error.scope;
      originalMessage = error.originalMessage;
      cause = error.cause;
    } else if (error instanceof Error) {
      originalMessage = error.message;
      cause = error.cause;
    } else if (isBoolean(error) || isNumber(error) || isString(error)) {
      originalMessage = error.toString();
    }

    super(`[${overriddenScope}] ${originalMessage ?? 'Unknown error'}`, {
      cause,
    });

    this.scope = overriddenScope;
    this.originalMessage = originalMessage;
  }
}

export class URLError extends ScopedError {
  constructor(error: unknown) {
    super('URL', error);
  }
}
