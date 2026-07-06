import { test } from "node:test";
import assert from "node:assert/strict";
import { resolveCtaState, initialCtaState, SUCCESS_MS } from "./cta.logic";

test("press → pressed, release → idle (non-destructive)", () => {
  const pressed = resolveCtaState(initialCtaState, { type: "press" }, {});
  assert.equal(pressed.phase, "pressed");
  assert.equal(resolveCtaState(pressed, { type: "release" }, {}).phase, "idle");
});

test("submitStart → inflight, submitOk → success", () => {
  const inflight = resolveCtaState(initialCtaState, { type: "submitStart" }, {});
  assert.equal(inflight.phase, "inflight");
  const ok = resolveCtaState(inflight, { type: "submitOk", at: 1000 }, {});
  assert.equal(ok.phase, "success");
});

test("success auto-collapses to idle after SUCCESS_MS, not before", () => {
  const inflight = resolveCtaState(initialCtaState, { type: "submitStart" }, {});
  const ok = resolveCtaState(inflight, { type: "submitOk", at: 1000 }, {});
  const still = resolveCtaState(ok, { type: "tick", at: 1000 + SUCCESS_MS - 1 }, {});
  assert.equal(still.phase, "success");
  const gone = resolveCtaState(ok, { type: "tick", at: 1000 + SUCCESS_MS }, {});
  assert.equal(gone.phase, "idle");
});

test("submitErr → error(retryable); retry → inflight", () => {
  const inflight = resolveCtaState(initialCtaState, { type: "submitStart" }, {});
  const err = resolveCtaState(inflight, { type: "submitErr", errorClass: "network" }, {});
  assert.equal(err.phase, "error");
  assert.equal(err.retryable, true);
  assert.equal(resolveCtaState(err, { type: "retry" }, {}).phase, "inflight");
});

test("destructive: press → confirm; confirm → inflight; cancel → idle", () => {
  const confirm = resolveCtaState(initialCtaState, { type: "press", at: 0 }, { destructive: true });
  assert.equal(confirm.phase, "confirm");
  assert.equal(resolveCtaState(confirm, { type: "confirm" }, { destructive: true }).phase, "inflight");
  assert.equal(resolveCtaState(confirm, { type: "cancel" }, { destructive: true }).phase, "idle");
});
