import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  ALL_DIVISIONS,
  ALL_ATTENTION_TYPES,
  ALL_SURFACES,
  ALL_PRIORITIES,
} from "../types";
import { validateAttentionInput } from "../publish";
import { visibleItems, ownerViewer, customerViewer } from "../access";
import { mockAttentionFeed } from "../mock/feed";

const FEED = mockAttentionFeed();

describe("mock attention feed", () => {
  it("is a non-trivial cross-division feed", () => {
    assert.ok(FEED.length >= 24, `expected >= 24 items, got ${FEED.length}`);
  });

  it("covers every division", () => {
    const present = new Set(FEED.map((i) => i.division));
    for (const d of ALL_DIVISIONS) assert.ok(present.has(d), `missing division: ${d}`);
  });

  it("covers every attention type", () => {
    const present = new Set(FEED.map((i) => i.type));
    for (const t of ALL_ATTENTION_TYPES) assert.ok(present.has(t), `missing type: ${t}`);
  });

  it("covers every surface and every priority", () => {
    const surfaces = new Set(FEED.map((i) => i.surface));
    for (const s of ALL_SURFACES) assert.ok(surfaces.has(s), `missing surface: ${s}`);
    const priorities = new Set(FEED.map((i) => i.priority));
    for (const p of ALL_PRIORITIES) assert.ok(priorities.has(p), `missing priority: ${p}`);
  });

  it("shows lifecycle variety (open plus worked/terminal states)", () => {
    const statuses = new Set(FEED.map((i) => i.status));
    assert.ok(statuses.has("open"));
    assert.ok(statuses.size >= 3, `expected >= 3 distinct statuses, got ${statuses.size}`);
  });

  it("every item satisfies the publish contract", () => {
    for (const item of FEED) {
      const { status: _status, ...input } = item;
      const r = validateAttentionInput(input);
      assert.ok(r.ok, `invalid feed item ${item.id}: ${r.ok ? "" : r.error.message}`);
    }
  });

  it("money items always carry a currency", () => {
    for (const item of FEED) {
      if (item.amountMinor != null) {
        assert.ok(item.currency, `item ${item.id} has amount but no currency`);
      }
    }
  });

  it("the owner sees the whole feed; a customer sees none", () => {
    assert.equal(visibleItems(ownerViewer(), FEED).length, FEED.length);
    assert.equal(visibleItems(customerViewer(), FEED).length, 0);
  });

  it("is deterministic across calls", () => {
    assert.deepEqual(
      mockAttentionFeed().map((i) => i.id),
      FEED.map((i) => i.id),
    );
  });
});
