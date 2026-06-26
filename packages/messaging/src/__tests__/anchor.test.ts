import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeAnchor } from "../anchor";

test("a known anchor type is preserved", () => {
  const a = normalizeAnchor({ type: "booking", id: "bk_9", division: "care" });
  assert.deepEqual(a, { type: "booking", id: "bk_9", division: "care" });
});

test("an unknown/odd anchor falls back to direct with null id (never crashes)", () => {
  const a = normalizeAnchor({ type: "wat", id: "x", division: "studio" });
  assert.equal(a.type, "direct");
  assert.equal(a.id, null);
  assert.equal(a.division, "studio");
});
