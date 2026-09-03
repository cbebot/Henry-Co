/**
 * Discriminated-union result idiom, copied verbatim from `@henryco/payment-router`
 * (`src/types.ts:8`). Callers branch on `ok` before touching `value`/`error`, so an
 * expected failure is never silently coerced into success. Adapters and the gateway
 * return this instead of throwing for expected failures.
 */
export type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

export function ok<T>(value: T): Result<T, never> {
  return { ok: true, value };
}

export function err<E>(error: E): Result<never, E> {
  return { ok: false, error };
}
