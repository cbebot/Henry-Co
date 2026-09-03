/**
 * @henryco/kyc — retention + crypto-shred engine.
 *
 * Two entry points:
 *   - `runScheduledShred()` — the cron. Scans non-shredded artifacts and
 *     crypto-shreds those past the configured window (no-op when unconfigured),
 *     respecting legal holds + AML floor (see `policy.ts`).
 *   - `eraseUserOnRequest(userId)` — NDPR on-request erasure. Crypto-shreds a
 *     user's artifacts that are erasable, retaining anything below the AML
 *     floor or under legal hold.
 *
 * Destruction itself is delegated to `KycVault.cryptoShred` (key destruction +
 * blob removal + per-artifact audit). The engine adds run/request-level audit.
 *
 * Reachable only via the server barrel + exports map.
 */
import {
  resolveErasureRequest,
  resolveScheduledRetention,
  type RetentionPolicy,
} from "./policy";
import type { KycVault } from "../vault/vault";
import type { VaultArtifactRepo, VaultAudit } from "../vault/ports";

export type RetentionSummary = { scanned: number; shredded: number; kept: number; failed: number };

export type RetentionEngineDeps = {
  vault: KycVault;
  repo: VaultArtifactRepo;
  audit: VaultAudit;
  policy: RetentionPolicy;
  now?: () => Date;
};

export class RetentionEngine {
  readonly #vault: KycVault;
  readonly #repo: VaultArtifactRepo;
  readonly #audit: VaultAudit;
  readonly #policy: RetentionPolicy;
  readonly #now: () => Date;

  constructor(deps: RetentionEngineDeps) {
    this.#vault = deps.vault;
    this.#repo = deps.repo;
    this.#audit = deps.audit;
    this.#policy = deps.policy;
    this.#now = deps.now ?? (() => new Date());
  }

  /** Scheduled retention sweep (the cron). */
  async runScheduledShred(): Promise<RetentionSummary> {
    const now = this.#now();
    const candidates = await this.#repo.listShreddable(now.toISOString());
    let shredded = 0;
    let kept = 0;
    let failed = 0;
    for (const record of candidates) {
      const decision = resolveScheduledRetention(record, this.#policy, now);
      if (decision.action !== "shred") {
        kept += 1;
        continue;
      }
      // Isolate per-record failures so one stuck record can't block the sweep.
      try {
        await this.#vault.cryptoShred(record.id, `retention: ${decision.reason}`);
        shredded += 1;
      } catch {
        failed += 1;
        await this.#audit.record({
          action: "kyc.vault.retention.shred_failed",
          entityId: record.id,
          userId: record.userId,
          reason: decision.reason,
        });
      }
    }
    const summary = { scanned: candidates.length, shredded, kept, failed };
    await this.#audit.record({
      action: "kyc.vault.retention.scheduled_run",
      entityId: "retention-engine",
      metadata: { ...summary, configured: this.#policy.retentionDays != null },
    });
    return summary;
  }

  /** On-request (NDPR) erasure of a single user's artifacts. */
  async eraseUserOnRequest(
    userId: string,
    opts: { actorUserId?: string | null } = {},
  ): Promise<RetentionSummary> {
    const now = this.#now();
    const records = (await this.#repo.listByUser(userId)).filter((r) => !r.cryptoShreddedAt);
    await this.#audit.record({
      action: "kyc.vault.erasure.requested",
      entityId: userId,
      userId,
      actorUserId: opts.actorUserId ?? null,
      metadata: { candidateCount: records.length },
    });
    let shredded = 0;
    let kept = 0;
    let failed = 0;
    for (const record of records) {
      const decision = resolveErasureRequest(record, this.#policy, now);
      if (decision.action !== "shred") {
        kept += 1;
        continue;
      }
      try {
        await this.#vault.cryptoShred(record.id, `erasure: ${decision.reason}`, {
          actorUserId: opts.actorUserId ?? null,
        });
        shredded += 1;
      } catch {
        failed += 1;
        await this.#audit.record({
          action: "kyc.vault.erasure.shred_failed",
          entityId: record.id,
          userId,
          actorUserId: opts.actorUserId ?? null,
          reason: decision.reason,
        });
      }
    }
    const summary = { scanned: records.length, shredded, kept, failed };
    await this.#audit.record({
      action: "kyc.vault.erasure.completed",
      entityId: userId,
      userId,
      actorUserId: opts.actorUserId ?? null,
      metadata: summary,
    });
    return summary;
  }
}
