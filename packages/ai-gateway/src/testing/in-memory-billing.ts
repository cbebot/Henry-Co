import type { Result } from "../result";
import { aiError, DEFAULT_AI_ERROR_COPY, type AiGatewayError } from "../errors";
import type { AiBillingPort, ReserveInput, ReserveResult, SettleInput, SettleResult } from "../billing-port";

interface Hold {
  id: string;
  userId: string;
  estimateKobo: number;
  idempotencyKey: string;
  status: "held" | "settled" | "released";
  expiresAt: number;
  usageEventId?: string;
  totalKobo?: number;
}

export interface InMemoryBillingOptions {
  /** userId → starting balance_kobo. */
  balances: Record<string, number>;
  now?: () => Date;
}

/**
 * A faithful in-memory model of the two guarded `payments_private` RPCs, for testing the
 * orchestrator's money flow without a database. It mirrors the SQL semantics the real
 * migration proves separately: available = balance − Σ(active holds); reserve refuses on
 * insufficient available; settle is idempotent per hold (one debit, one usage-event) and
 * never drives the balance negative. Counters expose how many real debits happened so a
 * test can prove "replay ⇒ exactly one charge".
 */
export class InMemoryBilling implements AiBillingPort {
  readonly balances: Map<string, number>;
  private readonly holds = new Map<string, Hold>();
  private readonly byIdem = new Map<string, string>();
  private readonly now: () => Date;
  private seq = 0;

  /** Number of times a real wallet debit was applied (idempotent replays do NOT increment). */
  debitCount = 0;
  /** Number of times settle() was invoked (including idempotent replays). */
  settleCalls = 0;
  /** Number of times reserve() created a NEW hold. */
  reserveCount = 0;

  constructor(opts: InMemoryBillingOptions) {
    this.balances = new Map(Object.entries(opts.balances));
    this.now = opts.now ?? (() => new Date(0));
  }

  balanceOf(userId: string): number {
    return this.balances.get(userId) ?? 0;
  }

  /** balance − Σ(held, unexpired). Mirrors the read-time available computation. */
  availableOf(userId: string): number {
    const nowMs = this.now().getTime();
    let held = 0;
    for (const h of this.holds.values()) {
      if (h.userId === userId && h.status === "held" && h.expiresAt > nowMs) held += h.estimateKobo;
    }
    return this.balanceOf(userId) - held;
  }

  async reserve(input: ReserveInput): Promise<Result<ReserveResult, AiGatewayError>> {
    // Idempotent on idempotencyKey — a replay returns the existing hold.
    const existingId = this.byIdem.get(input.idempotencyKey);
    if (existingId) return { ok: true, value: { holdId: existingId } };

    if (this.availableOf(input.userId) < input.estimateKobo) {
      return { ok: false, error: aiError("insufficient_funds", DEFAULT_AI_ERROR_COPY.insufficient_funds) };
    }
    const id = `hold-${++this.seq}`;
    this.holds.set(id, {
      id,
      userId: input.userId,
      estimateKobo: input.estimateKobo,
      idempotencyKey: input.idempotencyKey,
      status: "held",
      expiresAt: new Date(input.expiresAt).getTime(),
    });
    this.byIdem.set(input.idempotencyKey, id);
    this.reserveCount++;
    return { ok: true, value: { holdId: id } };
  }

  async settle(input: SettleInput): Promise<Result<SettleResult, AiGatewayError>> {
    this.settleCalls++;
    const hold = this.holds.get(input.holdId);
    if (!hold) return { ok: false, error: aiError("provider_error", "unknown hold") };

    const total = input.costKobo + input.marginKobo + input.vatKobo;

    // Idempotency: a settled hold returns its prior result, no second debit/post.
    if (hold.status === "settled") {
      return {
        ok: true,
        value: { usageEventId: hold.usageEventId as string, totalKobo: hold.totalKobo as number, balanceAfterKobo: this.balanceOf(hold.userId), duplicate: true },
      };
    }

    const balance = this.balanceOf(hold.userId);
    if (balance < total) {
      // Never-negative backstop (the reservation should have guaranteed balance >= total).
      return { ok: false, error: aiError("insufficient_funds", DEFAULT_AI_ERROR_COPY.insufficient_funds) };
    }

    const after = balance - total;
    this.balances.set(hold.userId, after);
    this.debitCount++;
    const usageEventId = `evt-${++this.seq}`;
    hold.status = "settled";
    hold.usageEventId = usageEventId;
    hold.totalKobo = total;
    return { ok: true, value: { usageEventId, totalKobo: total, balanceAfterKobo: after, duplicate: false } };
  }

  async release(input: { holdId: string }): Promise<void> {
    const hold = this.holds.get(input.holdId);
    if (hold && hold.status === "held") hold.status = "released";
  }
}
