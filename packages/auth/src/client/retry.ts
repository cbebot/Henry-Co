/**
 * withSessionRetry — exponential-backoff retry for auth-required
 * client mutations. The companion to the server `refresh-middleware`.
 *
 * Two responsibilities:
 *   1. Retry transient network failures (offline ↔ online flap during
 *      a save / submit). Up to `maxRetries` attempts with exponential
 *      backoff; 4xx / 5xx do NOT retry by default — the caller owns
 *      recovery semantics for application-level errors.
 *   2. Persist the in-flight Idempotency-Key for the duration of the
 *      mutation. If a reauth round-trip interrupts the request, the
 *      retry on the other side reuses the SAME key — no double-submit.
 *      (Addendum A3: stored under `henryco.inflight-idempotency.<draftKey>`.)
 *
 * Caller-shaped: this helper does NOT speak HTTP. It hands the
 * `idempotencyKey` to the caller's `fn`, which is expected to attach
 * it as the `Idempotency-Key` header (per V3-BACKLOG idempotency
 * conventions) and own the actual fetch / mutation call.
 */

const INFLIGHT_IDEMPOTENCY_PREFIX = "henryco.inflight-idempotency.";
const MAX_BACKOFF_MS = 8000;
const BASE_BACKOFF_MS = 250;

export type RetryBackoff = "exp" | "linear";

export type RetryOptions = {
  /**
   * Stable per-form / per-flow key. When provided, an Idempotency-Key
   * is reserved in `sessionStorage` so the same key survives a reauth
   * round-trip and is re-attached on the resubmit attempt. Call
   * `releaseIdempotencyKey(draftKey)` after a successful submit.
   */
  draftKey?: string;
  /**
   * Override the generated key (useful for tests, or when the caller
   * already owns the key lifecycle).
   */
  idempotencyKey?: string;
  /** Defaults to 3 retries (4 total attempts: initial + 3 retries). */
  maxRetries?: number;
  /** Defaults to "exp" — 250ms, 500ms, 1s, 2s, ... capped at 8s. */
  backoff?: RetryBackoff;
  /**
   * Callback the caller can use to decide retry-vs-bail. The default
   * retries on offline / network errors only.
   */
  shouldRetry?: (error: unknown, attempt: number) => boolean;
  /** Aborts the entire retry loop. */
  signal?: AbortSignal;
};

export type RetryContext = {
  attempt: number;
  /**
   * The Idempotency-Key the caller should attach as the
   * `Idempotency-Key` HTTP header on idempotent mutations. May be
   * undefined when no `draftKey` / `idempotencyKey` was provided.
   */
  idempotencyKey: string | undefined;
};

/**
 * Thrown when `signal` aborts mid-retry. The original cause from the
 * signal is exposed so callers can distinguish cancellation from a
 * network failure that exhausted retries.
 */
export class SessionRetryAbortError extends Error {
  override readonly name = "SessionRetryAbortError";
  constructor(readonly cause?: unknown) {
    super("withSessionRetry aborted");
  }
}

function hasSessionStorage(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return typeof window.sessionStorage !== "undefined";
  } catch {
    return false;
  }
}

function safeRandomUUID(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  // Fallback for ancient environments — should never hit in 2026 but
  // keeps the type contract honest.
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

/**
 * Reserve (or read) a persistent Idempotency-Key for the given draft.
 * Returns the same key on subsequent calls within the same browser
 * session until `releaseIdempotencyKey` is called.
 *
 * Falls back to an ephemeral UUID when sessionStorage is unavailable
 * (private mode, partitioned storage, SSR) — no throw.
 */
export function reserveIdempotencyKey(draftKey: string): string {
  if (!hasSessionStorage()) return safeRandomUUID();
  const slot = INFLIGHT_IDEMPOTENCY_PREFIX + draftKey;
  try {
    const existing = window.sessionStorage.getItem(slot);
    if (existing) return existing;
    const fresh = safeRandomUUID();
    window.sessionStorage.setItem(slot, fresh);
    return fresh;
  } catch {
    return safeRandomUUID();
  }
}

export function releaseIdempotencyKey(draftKey: string): void {
  if (!hasSessionStorage()) return;
  try {
    window.sessionStorage.removeItem(INFLIGHT_IDEMPOTENCY_PREFIX + draftKey);
  } catch {
    // ignored — best-effort cleanup
  }
}

function defaultShouldRetry(error: unknown): boolean {
  if (error instanceof TypeError && /network|failed to fetch|load failed/i.test(error.message)) {
    return true;
  }
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    return true;
  }
  return false;
}

function backoffDelay(attempt: number, mode: RetryBackoff): number {
  if (mode === "linear") {
    return BASE_BACKOFF_MS * (attempt + 1);
  }
  const exp = Math.min(MAX_BACKOFF_MS, BASE_BACKOFF_MS * 2 ** attempt);
  // Small jitter so a wave of reconnecting clients does not thunder.
  return exp + Math.floor(Math.random() * 100);
}

function waitOrAbort(ms: number, signal?: AbortSignal): Promise<void> {
  if (signal?.aborted) {
    return Promise.reject(new SessionRetryAbortError(signal.reason));
  }
  return new Promise<void>((resolve, reject) => {
    const onAbort = (): void => {
      cleanup();
      reject(new SessionRetryAbortError(signal?.reason));
    };
    const cleanup = (): void => {
      clearTimeout(timer);
      signal?.removeEventListener("abort", onAbort);
    };
    const timer = setTimeout(() => {
      cleanup();
      resolve();
    }, ms);
    signal?.addEventListener("abort", onAbort);
  });
}

/**
 * Retry a mutating client request with exponential backoff and a
 * stable Idempotency-Key.
 *
 * @example
 *   await withSessionRetry(
 *     async ({ idempotencyKey }) => {
 *       const res = await fetch("/api/support/threads", {
 *         method: "POST",
 *         headers: {
 *           "Content-Type": "application/json",
 *           ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}),
 *         },
 *         body: JSON.stringify(payload),
 *       });
 *       if (!res.ok) throw new Error(`http ${res.status}`);
 *       return res.json();
 *     },
 *     { draftKey: "support-thread-new", maxRetries: 3 },
 *   );
 *   // on success the caller calls releaseIdempotencyKey("support-thread-new")
 */
export async function withSessionRetry<T>(
  fn: (ctx: RetryContext) => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const maxRetries = options.maxRetries ?? 3;
  const backoff = options.backoff ?? "exp";
  const shouldRetry = options.shouldRetry ?? defaultShouldRetry;

  const idempotencyKey =
    options.idempotencyKey ??
    (options.draftKey ? reserveIdempotencyKey(options.draftKey) : undefined);

  let lastError: unknown = null;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    if (options.signal?.aborted) {
      throw new SessionRetryAbortError(options.signal.reason);
    }
    try {
      return await fn({ attempt, idempotencyKey });
    } catch (error) {
      lastError = error;
      const giveUp = attempt >= maxRetries || !shouldRetry(error, attempt);
      if (giveUp) break;
      await waitOrAbort(backoffDelay(attempt, backoff), options.signal);
    }
  }
  throw lastError;
}
