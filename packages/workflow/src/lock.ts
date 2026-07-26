/**
 * The ONE single-flight lock primitive (V3-43 consolidation). Generalizes the
 * two shipped hand-rolled locks — studio's `studio_agency_tick_lock`
 * (`acquireTickLock`, applied on prod) and SA-4's `ai_operator_tick_lock`
 * (`acquireOperatorTickLock`, migration UNAPPLIED) — into one CAS-row table
 * `workflow_locks` keyed by `lock_key`. Same PostgREST-safe conditional-UPDATE
 * CAS semantics (win iff `locked_until < now`), so overlapping cron ticks
 * serialize and the daily-ceiling reservation holds ACROSS ticks, not just
 * within one (SA-3's proven concurrent-tick lesson).
 *
 * Pure over a `LockStore` seam so the single-flight property is unit-provable;
 * the DB adapter is a thin `workflow_locks` CAS.
 */

/** The CAS lock seam. `tryAcquire` returns true ONLY if it moved the lock
 *  (won the CAS); a loser gets false and must no-op. */
export interface LockStore {
  tryAcquire(input: { key: string; untilIso: string; worker: string; nowIso: string }): Promise<boolean>;
  /** Release ONLY if `worker` still holds it (never clobber a stolen-after-TTL lock). */
  release(input: { key: string; worker: string; nowIso: string }): Promise<void>;
}

/**
 * Acquire the single-flight lock for `key`. The TTL MUST exceed the caller
 * route's `maxDuration` so the platform kills an overrunning tick BEFORE its
 * lock can expire (a live tick can never outlive its own lock — SA-3's rule).
 */
export async function acquireWorkflowLock(
  store: LockStore,
  input: { key: string; ttlSeconds: number; worker: string; now: Date },
): Promise<boolean> {
  const nowIso = input.now.toISOString();
  const untilIso = new Date(input.now.getTime() + input.ttlSeconds * 1000).toISOString();
  try {
    return await store.tryAcquire({ key: input.key, untilIso, worker: input.worker, nowIso });
  } catch {
    return false; // a broken lock store must NOT let a tick run unguarded
  }
}

export async function releaseWorkflowLock(
  store: LockStore,
  input: { key: string; worker: string; now: Date },
): Promise<void> {
  try {
    await store.release({ key: input.key, worker: input.worker, nowIso: input.now.toISOString() });
  } catch {
    // a stuck lock self-heals at TTL expiry
  }
}

/** The canonical lock keys — one per drain loop retired onto the rail. */
export const LOCK_KEYS = {
  studioAgencyTick: "studio.agency.tick",
  hubOperatorTick: "hub.operator.tick",
} as const;

/** In-memory single-row-per-key CAS — identical semantics to the DB table. */
export class InMemoryLockStore implements LockStore {
  private rows = new Map<string, { lockedUntil: number; holder: string | null }>();

  seed(key: string): void {
    if (!this.rows.has(key)) this.rows.set(key, { lockedUntil: 0, holder: null });
  }

  async tryAcquire(input: { key: string; untilIso: string; worker: string; nowIso: string }): Promise<boolean> {
    this.seed(input.key);
    const row = this.rows.get(input.key)!;
    const nowMs = Date.parse(input.nowIso);
    // CAS: win ONLY if the prior lock has expired (locked_until < now).
    if (row.lockedUntil < nowMs) {
      row.lockedUntil = Date.parse(input.untilIso);
      row.holder = input.worker;
      return true;
    }
    return false;
  }

  async release(input: { key: string; worker: string; nowIso: string }): Promise<void> {
    const row = this.rows.get(input.key);
    if (row && row.holder === input.worker) {
      row.lockedUntil = Date.parse(input.nowIso);
    }
  }
}
