/**
 * Bound a promise with a timeout.
 *
 * On expiry the returned promise rejects with a `TimeoutError`. The underlying
 * work is NOT cancelled — callers that need true cancellation must thread an
 * AbortSignal into the work itself — but the *caller* is unblocked, so a slow
 * dependency (e.g. a saturated database) can never hang a request all the way
 * to the Vercel function timeout (504). Read paths use this to degrade fast
 * instead of stalling the shell.
 */

export class TimeoutError extends Error {
  constructor(ms: number) {
    super(`Operation timed out after ${ms}ms`);
    this.name = "TimeoutError";
  }
}

export function withTimeout<T>(promise: PromiseLike<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new TimeoutError(ms)), ms);
    Promise.resolve(promise).then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}
