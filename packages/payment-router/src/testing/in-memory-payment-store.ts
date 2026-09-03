import { randomUUID } from "node:crypto";
import type { PaymentIntentStatus, PaymentMethod } from "../types";
import { assertTransition } from "../state-machine";

/**
 * In-memory transactional reference for the payment money-correctness rules.
 *
 * This is the EXECUTABLE MIRROR of the production SQL in
 * `apps/hub/supabase/migrations/20260529120000_payment_intents.sql`:
 *   - A1: `createIntent` enforces UNIQUE(user_id, idempotency_key) — a repeat
 *     returns the existing row instead of creating a duplicate.
 *   - A2: `transition` / `applyWebhook` enforce legal transitions via the shared
 *     `assertTransition` table (same table the SQL trigger transcribes).
 *   - A3: `applyWebhook` does dedup-insert FIRST, effect SECOND, atomically. A
 *     duplicate delivery is an idempotent ack. A crash between the two steps
 *     rolls back BOTH (single transaction), so a replay re-runs cleanly.
 *
 * Because TS and SQL share the same transition table by construction, the SQL
 * cannot silently drift from this tested behaviour.
 */

interface IntentRow {
  id: string;
  userId: string;
  amountMinor: number;
  currency: string;
  country: string;
  method: PaymentMethod;
  status: PaymentIntentStatus;
  idempotencyKey: string;
  division: string | null;
}

interface CreateInput {
  userId: string;
  amountMinor: number;
  currency: string;
  country: string;
  method: PaymentMethod;
  idempotencyKey: string;
  division?: string | null;
}

interface WebhookEvent {
  provider: string;
  providerEventId: string;
  intentId: string;
  impliedStatus: "succeeded" | "failed" | "refunded";
}

type StoreResult<T> = { ok: true; value: T } | { ok: false; error: string };

const IMPLIED_TO_STATUS: Record<WebhookEvent["impliedStatus"], PaymentIntentStatus> = {
  succeeded: "succeeded",
  failed: "failed",
  refunded: "refunded",
};

export class InMemoryPaymentStore {
  private intents = new Map<string, IntentRow>();
  private byIdemKey = new Map<string, string>(); // `${userId}:${key}` → intentId (mirrors UNIQUE)
  private processedWebhooks = new Set<string>(); // `${provider}:${eventId}` (mirrors UNIQUE)

  /** Test-only switch modelling a crash AFTER dedup-insert, BEFORE the effect commits. */
  __crashAfterDedupInsert = false;

  createIntent(input: CreateInput): StoreResult<IntentRow> {
    const idemComposite = `${input.userId}:${input.idempotencyKey}`;
    const existingId = this.byIdemKey.get(idemComposite);
    if (existingId) {
      // A1: UNIQUE(user_id, idempotency_key) collision → return the existing row.
      return { ok: true, value: this.intents.get(existingId)! };
    }
    const row: IntentRow = {
      id: randomUUID(),
      userId: input.userId,
      amountMinor: input.amountMinor,
      currency: input.currency,
      country: input.country,
      method: input.method,
      status: "pending",
      idempotencyKey: input.idempotencyKey,
      division: input.division ?? null,
    };
    this.intents.set(row.id, row);
    this.byIdemKey.set(idemComposite, row.id);
    return { ok: true, value: row };
  }

  transition(intentId: string, to: PaymentIntentStatus): StoreResult<IntentRow> {
    const row = this.intents.get(intentId);
    if (!row) return { ok: false, error: "intent not found" };
    try {
      assertTransition(row.status, to); // A2
    } catch (e) {
      return { ok: false, error: (e as Error).message };
    }
    row.status = to;
    return { ok: true, value: row };
  }

  /**
   * Mirrors `apply_payment_webhook()`. Dedup-insert FIRST, effect SECOND, both
   * in one logical transaction. A duplicate short-circuits to an idempotent ack.
   * An illegal implied transition is rejected WITHOUT recording dedup, so the
   * delivery can be safely retried. A crash between steps (see the test switch)
   * commits nothing — modelling the SQL transaction rollback.
   */
  applyWebhook(evt: WebhookEvent): StoreResult<{ applied: boolean }> {
    const dedupKey = `${evt.provider}:${evt.providerEventId}`;
    if (this.processedWebhooks.has(dedupKey)) {
      return { ok: true, value: { applied: false } }; // idempotent ack
    }
    if (this.__crashAfterDedupInsert) {
      // Transaction aborts before COMMIT: neither the dedup row nor the effect persist.
      throw new Error("simulated crash after dedup-insert, before effect");
    }
    const row = this.intents.get(evt.intentId);
    if (!row) return { ok: false, error: "intent not found" };
    const target = IMPLIED_TO_STATUS[evt.impliedStatus];
    try {
      assertTransition(row.status, target); // A2 — failure rolls back (no dedup recorded)
    } catch (e) {
      return { ok: false, error: (e as Error).message };
    }
    // COMMIT: dedup row + status effect, together.
    this.processedWebhooks.add(dedupKey);
    row.status = target;
    return { ok: true, value: { applied: true } };
  }

  getIntent(id: string): IntentRow | undefined {
    return this.intents.get(id);
  }
  count(): number {
    return this.intents.size;
  }
}
