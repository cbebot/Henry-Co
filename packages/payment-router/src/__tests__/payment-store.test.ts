import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { InMemoryPaymentStore } from "../testing/in-memory-payment-store";

function freshIntent() {
  return {
    userId: "u1",
    amountMinor: 50000,
    currency: "NGN",
    country: "NG",
    method: "card" as const,
    idempotencyKey: "key-1",
    division: "marketplace",
  };
}

describe("InMemoryPaymentStore — A1 idempotent create", () => {
  it("returns the SAME intent id for a repeated (userId, idempotencyKey)", () => {
    const store = new InMemoryPaymentStore();
    const a = store.createIntent(freshIntent());
    const b = store.createIntent(freshIntent());
    assert.ok(a.ok && b.ok);
    if (a.ok && b.ok) assert.equal(a.value.id, b.value.id);
    assert.equal(store.count(), 1, "no duplicate row created");
  });

  it("treats a different idempotencyKey as a new intent", () => {
    const store = new InMemoryPaymentStore();
    store.createIntent(freshIntent());
    store.createIntent({ ...freshIntent(), idempotencyKey: "key-2" });
    assert.equal(store.count(), 2);
  });

  it("scopes idempotency per-user (same key, different users → two intents)", () => {
    const store = new InMemoryPaymentStore();
    store.createIntent(freshIntent());
    store.createIntent({ ...freshIntent(), userId: "u2" });
    assert.equal(store.count(), 2);
  });
});

describe("InMemoryPaymentStore — A2 transition enforcement", () => {
  it("rejects an illegal transition (pending → refunded)", () => {
    const store = new InMemoryPaymentStore();
    const c = store.createIntent(freshIntent());
    assert.ok(c.ok);
    if (c.ok) {
      const r = store.transition(c.value.id, "refunded");
      assert.equal(r.ok, false);
      assert.equal(store.getIntent(c.value.id)?.status, "pending", "status unchanged after illegal move");
    }
  });

  it("permits the legal pending → processing → succeeded path", () => {
    const store = new InMemoryPaymentStore();
    const c = store.createIntent(freshIntent());
    assert.ok(c.ok);
    if (c.ok) {
      assert.equal(store.transition(c.value.id, "processing").ok, true);
      assert.equal(store.transition(c.value.id, "succeeded").ok, true);
    }
  });
});

describe("InMemoryPaymentStore — A3 webhook dedup (dedup-insert FIRST, effect SECOND)", () => {
  it("applies the effect exactly once across duplicate webhook deliveries", () => {
    const store = new InMemoryPaymentStore();
    const c = store.createIntent(freshIntent());
    assert.ok(c.ok);
    if (!c.ok) return;
    store.transition(c.value.id, "processing");
    const evt = {
      provider: "mock",
      providerEventId: "evt_9",
      intentId: c.value.id,
      impliedStatus: "succeeded" as const,
    };
    const first = store.applyWebhook(evt);
    const second = store.applyWebhook(evt); // duplicate delivery
    assert.ok(first.ok && first.value.applied);
    assert.ok(second.ok && !second.value.applied, "duplicate is an idempotent ack, not re-applied");
    assert.equal(store.getIntent(c.value.id)?.status, "succeeded");
  });

  it("CRASH-BETWEEN-STEPS: a crash after dedup-insert, before effect, rolls back so replay completes", () => {
    const store = new InMemoryPaymentStore();
    const c = store.createIntent(freshIntent());
    assert.ok(c.ok);
    if (!c.ok) return;
    store.transition(c.value.id, "processing");
    const evt = {
      provider: "mock",
      providerEventId: "evt_crash",
      intentId: c.value.id,
      impliedStatus: "succeeded" as const,
    };
    // Simulate a crash AFTER the dedup-insert but BEFORE the effect commits.
    store.__crashAfterDedupInsert = true;
    assert.throws(() => store.applyWebhook(evt));
    assert.equal(store.getIntent(c.value.id)?.status, "processing", "effect did not land");
    // The production RPC is one transaction: the crash rolls back the dedup row too,
    // so a replay finds no dedup record and re-runs the effect cleanly.
    store.__crashAfterDedupInsert = false;
    const replay = store.applyWebhook(evt);
    assert.ok(replay.ok && replay.value.applied, "replay applies the effect");
    assert.equal(store.getIntent(c.value.id)?.status, "succeeded");
  });

  it("a webhook implying an illegal transition is rejected without recording dedup (safe to retry)", () => {
    const store = new InMemoryPaymentStore();
    const c = store.createIntent(freshIntent());
    assert.ok(c.ok);
    if (!c.ok) return;
    // status is 'pending'; a 'refunded' webhook is illegal from pending.
    const evt = {
      provider: "mock",
      providerEventId: "evt_bad",
      intentId: c.value.id,
      impliedStatus: "refunded" as const,
    };
    const r = store.applyWebhook(evt);
    assert.equal(r.ok, false);
  });
});

describe("InMemoryPaymentStore — Q3 refund lifecycle (refunded means provider-confirmed)", () => {
  /** Drive a fresh intent all the way to a confirmed `succeeded`. */
  function succeededIntent() {
    const store = new InMemoryPaymentStore();
    const c = store.createIntent(freshIntent());
    assert.ok(c.ok);
    const id = (c as { value: { id: string } }).value.id;
    store.transition(id, "processing");
    store.applyWebhook({ provider: "paystack", providerEventId: "ref_1", intentId: id, impliedStatus: "succeeded" });
    assert.equal(store.getIntent(id)?.status, "succeeded");
    return { store, id };
  }

  it("succeeded → refund_processing (request) → refunded (refund.processed webhook)", () => {
    const { store, id } = succeededIntent();
    // The refund REQUEST is a non-money advance (mirrors advance_payment_intent).
    assert.equal(store.transition(id, "refund_processing").ok, true);
    // Money only confirmed-moved when the provider's refund.processed webhook lands.
    const w = store.applyWebhook({ provider: "paystack", providerEventId: "refund:ref_1", intentId: id, impliedStatus: "refunded" });
    assert.ok(w.ok && w.value.applied);
    assert.equal(store.getIntent(id)?.status, "refunded");
  });

  it("refund_processing → succeeded revert when the refund fails (refund.failed webhook)", () => {
    const { store, id } = succeededIntent();
    store.transition(id, "refund_processing");
    // refund.failed implies `succeeded`: money never left, so succeeded is the honest state.
    const w = store.applyWebhook({ provider: "paystack", providerEventId: "refund:ref_1", intentId: id, impliedStatus: "succeeded" });
    assert.ok(w.ok && w.value.applied);
    assert.equal(store.getIntent(id)?.status, "succeeded");
  });

  it("rejects a DIRECT succeeded → refunded webhook (must pass through refund_processing)", () => {
    const { store, id } = succeededIntent();
    // A refund.processed arriving while still `succeeded` is illegal — `refunded`
    // can only be reached from `refund_processing`. Rejected without recording dedup.
    const w = store.applyWebhook({ provider: "paystack", providerEventId: "refund:ref_1", intentId: id, impliedStatus: "refunded" });
    assert.equal(w.ok, false);
    assert.equal(store.getIntent(id)?.status, "succeeded", "status unchanged after illegal refund");
  });

  it("dedups a duplicate refund.processed delivery (refunded is reached exactly once)", () => {
    const { store, id } = succeededIntent();
    store.transition(id, "refund_processing");
    const evt = { provider: "paystack", providerEventId: "refund:ref_1", intentId: id, impliedStatus: "refunded" as const };
    const first = store.applyWebhook(evt);
    const second = store.applyWebhook(evt);
    assert.ok(first.ok && first.value.applied);
    assert.ok(second.ok && !second.value.applied, "duplicate refund.processed is an idempotent ack");
    assert.equal(store.getIntent(id)?.status, "refunded");
  });
});
