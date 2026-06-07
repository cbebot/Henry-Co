import { test } from "node:test";
import assert from "node:assert/strict";

import {
  resolveShellToast,
  emitShellToast,
  subscribeShellToast,
  TONE_DEFAULT_DURATION_MS,
} from "../shell/toast-bus";

test("resolveShellToast fills defaults by tone", () => {
  const s = resolveShellToast({ title: "Saved" });
  assert.equal(s.tone, "info");
  assert.equal(s.durationMs, TONE_DEFAULT_DURATION_MS.info);
  assert.equal(s.body, null);
  assert.equal(s.href, null);
  assert.ok(s.id.length > 0);
});

test("error tone is sticky by default (null duration so it can't be missed)", () => {
  assert.equal(resolveShellToast({ title: "Nope", tone: "error" }).durationMs, null);
});

test("explicit durationMs overrides the tone default (incl. null)", () => {
  assert.equal(
    resolveShellToast({ title: "x", tone: "error", durationMs: 2000 }).durationMs,
    2000,
  );
  assert.equal(
    resolveShellToast({ title: "x", tone: "success", durationMs: null }).durationMs,
    null,
  );
});

test("explicit id is preserved (enables replace-in-place)", () => {
  assert.equal(resolveShellToast({ title: "x", id: "fixed" }).id, "fixed");
});

test("emit notifies subscribers; unsubscribe stops them", () => {
  const seen: string[] = [];
  const unsub = subscribeShellToast((t) => seen.push(t.title));
  emitShellToast({ title: "one" });
  emitShellToast({ title: "two", tone: "success" });
  unsub();
  emitShellToast({ title: "three" });
  assert.deepEqual(seen, ["one", "two"]);
});

test("a throwing subscriber never breaks emit for the others", () => {
  const seen: string[] = [];
  const unsubA = subscribeShellToast(() => {
    throw new Error("bad listener");
  });
  const unsubB = subscribeShellToast((t) => seen.push(t.title));
  const id = emitShellToast({ title: "resilient" });
  unsubA();
  unsubB();
  assert.deepEqual(seen, ["resilient"]);
  assert.ok(id.length > 0);
});
