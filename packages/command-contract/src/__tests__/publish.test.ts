import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { attentionItemId, type AttentionItemInput } from "../types";
import {
  InMemoryAttentionStore,
  publishAttentionItem,
  validateAttentionInput,
} from "../publish";

function validInput(overrides: Partial<AttentionItemInput> = {}): AttentionItemInput {
  return {
    id: attentionItemId("learn:app:42"),
    division: "learn",
    type: "seller-application",
    priority: "high",
    surface: "both",
    title: "New instructor application",
    summary: "Ada applied to teach; approving sets the revenue share.",
    actionLabel: "Review application",
    deepLink: "/owner/instructors",
    createdAt: "2026-06-04T10:00:00.000Z",
    ...overrides,
  };
}

describe("publish-to-command contract", () => {
  it("publishes a valid item, stamps status 'open', and stores it", () => {
    const store = new InMemoryAttentionStore();
    const result = publishAttentionItem(store, validInput());
    assert.ok(result.ok);
    assert.equal(result.value.status, "open");
    assert.equal(store.list().length, 1);
    assert.equal(store.list()[0].id, validInput().id);
  });

  it("rejects an unknown division and does not store anything", () => {
    const store = new InMemoryAttentionStore();
    const result = publishAttentionItem(store, validInput({ division: "nope" as never }));
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.error.field, "division");
    assert.equal(store.list().length, 0);
  });

  it("rejects an unknown type", () => {
    const r = validateAttentionInput(validInput({ type: "made-up" as never }));
    assert.equal(r.ok, false);
    if (!r.ok) assert.equal(r.error.field, "type");
  });

  it("rejects an empty title and an empty deep link", () => {
    const t = validateAttentionInput(validInput({ title: "   " }));
    assert.equal(t.ok, false);
    if (!t.ok) assert.equal(t.error.field, "title");
    const d = validateAttentionInput(validInput({ deepLink: "" }));
    assert.equal(d.ok, false);
    if (!d.ok) assert.equal(d.error.field, "deepLink");
  });

  it("rejects non-positive or non-integer money amounts", () => {
    const neg = validateAttentionInput(validInput({ amountMinor: -100, currency: "NGN" }));
    assert.equal(neg.ok, false);
    if (!neg.ok) assert.equal(neg.error.field, "amountMinor");
    const frac = validateAttentionInput(validInput({ amountMinor: 10.5, currency: "NGN" }));
    assert.equal(frac.ok, false);
    if (!frac.ok) assert.equal(frac.error.field, "amountMinor");
  });

  it("requires a currency whenever an amount is present, and normalises it to upper-case", () => {
    const missing = validateAttentionInput(validInput({ amountMinor: 5000, currency: null }));
    assert.equal(missing.ok, false);
    if (!missing.ok) assert.equal(missing.error.field, "currency");

    const lower = validateAttentionInput(validInput({ amountMinor: 5000, currency: "ngn" }));
    assert.ok(lower.ok);
    if (lower.ok) assert.equal(lower.value.currency, "NGN");
  });

  it("rejects an invalid createdAt timestamp", () => {
    const r = validateAttentionInput(validInput({ createdAt: "not-a-date" }));
    assert.equal(r.ok, false);
    if (!r.ok) assert.equal(r.error.field, "createdAt");
  });

  it("rejects a staffScope entry that is not a known staff division", () => {
    const r = validateAttentionInput(validInput({ staffScope: ["marketplace", "bogus" as never] }));
    assert.equal(r.ok, false);
    if (!r.ok) assert.equal(r.error.field, "staffScope");
  });

  it("defaults staffScope to [division] when omitted", () => {
    const r = validateAttentionInput(validInput());
    assert.ok(r.ok);
    if (r.ok) assert.deepEqual(r.value.staffScope, ["learn"]);
  });

  it("accumulates multiple published items in order", () => {
    const store = new InMemoryAttentionStore();
    publishAttentionItem(store, validInput({ id: attentionItemId("a") }));
    publishAttentionItem(store, validInput({ id: attentionItemId("b") }));
    assert.deepEqual(
      store.list().map((i) => i.id),
      ["a", "b"],
    );
  });
});
