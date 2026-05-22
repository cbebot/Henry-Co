/**
 * withSessionRetry unit tests — exponential-backoff retry, idempotency-
 * key persistence, abort semantics.
 *
 * Tests use `linear` backoff with the smallest possible delays so
 * the suite completes in < 2s end-to-end. Exponential backoff is
 * exercised via `delayFor`-equivalent observation (attempt count + abort)
 * rather than real wall-clock delays.
 */

import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";

import {
  withSessionRetry,
  reserveIdempotencyKey,
  releaseIdempotencyKey,
  SessionRetryAbortError,
} from "../client/retry";

declare const __resetAuthTestState: () => void;

beforeEach(() => {
  __resetAuthTestState();
});

test("withSessionRetry: success on first try → no retries", async () => {
  let calls = 0;
  const got = await withSessionRetry(async () => {
    calls++;
    return "ok";
  });
  assert.equal(got, "ok");
  assert.equal(calls, 1);
});

test("withSessionRetry: retries network errors up to maxRetries", async () => {
  let calls = 0;
  const networkError = new TypeError("Failed to fetch");
  await assert.rejects(
    () =>
      withSessionRetry(
        async () => {
          calls++;
          throw networkError;
        },
        { maxRetries: 2, backoff: "linear" },
      ),
    (e: unknown) => e === networkError,
  );
  // Initial attempt + 2 retries = 3 calls
  assert.equal(calls, 3);
});

test("withSessionRetry: does NOT retry on application errors", async () => {
  let calls = 0;
  const appError = new Error("validation failed");
  await assert.rejects(
    () =>
      withSessionRetry(
        async () => {
          calls++;
          throw appError;
        },
        { maxRetries: 3 },
      ),
    (e: unknown) => e === appError,
  );
  assert.equal(calls, 1);
});

test("withSessionRetry: succeeds after one transient failure", async () => {
  let calls = 0;
  const got = await withSessionRetry(
    async () => {
      calls++;
      if (calls < 2) throw new TypeError("Failed to fetch");
      return "ok";
    },
    { maxRetries: 3, backoff: "linear" },
  );
  assert.equal(got, "ok");
  assert.equal(calls, 2);
});

test("withSessionRetry: custom shouldRetry overrides default", async () => {
  let calls = 0;
  const got = await withSessionRetry(
    async () => {
      calls++;
      if (calls < 2) throw new Error("non-network but caller knows it's transient");
      return "ok";
    },
    { maxRetries: 3, backoff: "linear", shouldRetry: () => true },
  );
  assert.equal(got, "ok");
  assert.equal(calls, 2);
});

test("withSessionRetry: AbortSignal pre-aborted → SessionRetryAbortError immediately", async () => {
  const ac = new AbortController();
  ac.abort("test-reason");
  let calls = 0;
  await assert.rejects(
    () =>
      withSessionRetry(
        async () => {
          calls++;
          return "should-never-happen";
        },
        { signal: ac.signal },
      ),
    (e: unknown) => e instanceof SessionRetryAbortError,
  );
  assert.equal(calls, 0);
});

test("withSessionRetry: AbortSignal aborts during backoff", async () => {
  const ac = new AbortController();
  setTimeout(() => ac.abort("test"), 50);
  let calls = 0;
  await assert.rejects(
    () =>
      withSessionRetry(
        async () => {
          calls++;
          throw new TypeError("network");
        },
        { signal: ac.signal, maxRetries: 5, backoff: "linear" },
      ),
    (e: unknown) => e instanceof SessionRetryAbortError,
  );
  // At least the first attempt fired; abort caught it during the first backoff window.
  assert.ok(calls >= 1, `expected at least one call, got ${calls}`);
  assert.ok(calls < 5, `expected abort to short-circuit retries, got ${calls}`);
});

test("withSessionRetry: idempotencyKey is stable across retries", async () => {
  const seen: (string | undefined)[] = [];
  await assert.rejects(() =>
    withSessionRetry(
      async ({ idempotencyKey }) => {
        seen.push(idempotencyKey);
        throw new TypeError("network");
      },
      { idempotencyKey: "fixed-key", maxRetries: 2, backoff: "linear" },
    ),
  );
  assert.equal(seen.length, 3);
  assert.ok(
    seen.every((k) => k === "fixed-key"),
    "all attempts share the same idempotency key",
  );
});

test("withSessionRetry: draftKey persists key in sessionStorage across calls (Addendum A3)", async () => {
  const firstSeen: (string | undefined)[] = [];
  const draftKey = "support-thread-new";

  await assert.rejects(() =>
    withSessionRetry(
      async ({ idempotencyKey }) => {
        firstSeen.push(idempotencyKey);
        throw new TypeError("network");
      },
      { draftKey, maxRetries: 1, backoff: "linear" },
    ),
  );

  // Simulating a reauth round-trip: the form resubmits later — the
  // same draftKey must yield the SAME Idempotency-Key.
  const secondSeen: (string | undefined)[] = [];
  await assert.rejects(() =>
    withSessionRetry(
      async ({ idempotencyKey }) => {
        secondSeen.push(idempotencyKey);
        throw new TypeError("network");
      },
      { draftKey, maxRetries: 0, backoff: "linear" },
    ),
  );

  assert.ok(firstSeen[0]);
  assert.equal(firstSeen[0], secondSeen[0]);
});

test("withSessionRetry: contextual attempt number", async () => {
  const attempts: number[] = [];
  await assert.rejects(() =>
    withSessionRetry(
      async ({ attempt }) => {
        attempts.push(attempt);
        throw new TypeError("network");
      },
      { maxRetries: 2, backoff: "linear" },
    ),
  );
  assert.deepEqual(attempts, [0, 1, 2]);
});

test("reserveIdempotencyKey: same draftKey returns same UUID", () => {
  const a = reserveIdempotencyKey("draft-A");
  const b = reserveIdempotencyKey("draft-A");
  assert.equal(a, b);
});

test("reserveIdempotencyKey: distinct draftKeys yield distinct UUIDs", () => {
  const a = reserveIdempotencyKey("draft-A");
  const b = reserveIdempotencyKey("draft-B");
  assert.notEqual(a, b);
});

test("releaseIdempotencyKey: clears so next reserve generates fresh UUID", () => {
  const first = reserveIdempotencyKey("draft-A");
  releaseIdempotencyKey("draft-A");
  const second = reserveIdempotencyKey("draft-A");
  assert.notEqual(first, second);
});

test("reserveIdempotencyKey: returns a v4-ish UUID by default", () => {
  const k = reserveIdempotencyKey("any");
  assert.match(k, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
});
