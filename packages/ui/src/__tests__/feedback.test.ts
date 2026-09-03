import { test } from "node:test";
import assert from "node:assert/strict";

import {
  emitFeedbackToast,
  isActiveToastRenderer,
  registerToastRenderer,
  resolveFeedbackToast,
  subscribeFeedbackToast,
  TONE_DEFAULT_DURATION_MS,
} from "../feedback/toast-bus";
import { CHIME_MIN_GAP_MS, planActionChime } from "../feedback/chime-policy";

// ── Dwell ladder (ONE ladder company-wide — the #243 severity values) ─────

test("the unified dwell ladder matches the notifications severity ladder", () => {
  assert.equal(TONE_DEFAULT_DURATION_MS.success, 4_500);
  assert.equal(TONE_DEFAULT_DURATION_MS.info, 4_000);
  assert.equal(TONE_DEFAULT_DURATION_MS.warning, 5_500);
  assert.equal(TONE_DEFAULT_DURATION_MS.error, null);
});

test("resolveFeedbackToast fills defaults; chime defaults OFF (opt-in only)", () => {
  const t = resolveFeedbackToast({ title: "Saved" });
  assert.equal(t.tone, "info");
  assert.equal(t.durationMs, TONE_DEFAULT_DURATION_MS.info);
  assert.equal(t.chime, false);
  assert.equal(t.action, null);
  assert.ok(t.id.length > 0);
});

test("errors are sticky; explicit durationMs (incl. null) overrides", () => {
  assert.equal(resolveFeedbackToast({ title: "x", tone: "error" }).durationMs, null);
  assert.equal(
    resolveFeedbackToast({ title: "x", tone: "success", durationMs: null }).durationMs,
    null,
  );
  assert.equal(
    resolveFeedbackToast({ title: "x", tone: "error", durationMs: 2000 }).durationMs,
    2000,
  );
});

// ── Pre-mount buffer ───────────────────────────────────────────────────────

test("emits before any subscriber are buffered and flushed once to the first", () => {
  emitFeedbackToast({ title: "early-one" });
  emitFeedbackToast({ title: "early-two", tone: "success" });
  const seenA: string[] = [];
  const unsubA = subscribeFeedbackToast((t) => seenA.push(t.title));
  assert.deepEqual(seenA, ["early-one", "early-two"]);
  // A second subscriber gets no replay — the buffer is one-shot.
  const seenB: string[] = [];
  const unsubB = subscribeFeedbackToast((t) => seenB.push(t.title));
  assert.deepEqual(seenB, []);
  unsubA();
  unsubB();
});

test("emit notifies live subscribers; a throwing listener never breaks the emit", () => {
  const seen: string[] = [];
  const unsubBad = subscribeFeedbackToast(() => {
    throw new Error("bad listener");
  });
  const unsubGood = subscribeFeedbackToast((t) => seen.push(t.title));
  const id = emitFeedbackToast({ title: "resilient" });
  unsubBad();
  unsubGood();
  assert.deepEqual(seen, ["resilient"]);
  assert.ok(id.length > 0);
});

// ── Renderer election ──────────────────────────────────────────────────────

test("highest priority renderer wins; release re-elects; ties go to the later registrant", () => {
  const base = registerToastRenderer(0);
  assert.equal(isActiveToastRenderer(base.id), true);

  const shell = registerToastRenderer(10);
  assert.equal(isActiveToastRenderer(base.id), false);
  assert.equal(isActiveToastRenderer(shell.id), true);

  // Same priority registered later (a more deeply nested host) wins the tie.
  const nested = registerToastRenderer(10);
  assert.equal(isActiveToastRenderer(shell.id), false);
  assert.equal(isActiveToastRenderer(nested.id), true);

  nested.release();
  assert.equal(isActiveToastRenderer(shell.id), true);
  shell.release();
  assert.equal(isActiveToastRenderer(base.id), true);
  base.release();
  assert.equal(isActiveToastRenderer(base.id), false);
});

// ── Chime policy (the restraint rules, pure) ───────────────────────────────

const VISIBLE: DocumentVisibilityState = "visible";

test("only success and error may sound — info and warning never do", () => {
  const base = { soundsEnabled: true, visibility: VISIBLE, now: 10_000, lastChimeAt: 0 };
  assert.deepEqual(planActionChime({ ...base, tone: "success" }), {
    play: true,
    variant: "action-success",
  });
  assert.deepEqual(planActionChime({ ...base, tone: "error" }), {
    play: true,
    variant: "action-error",
  });
  assert.deepEqual(planActionChime({ ...base, tone: "info" }), { play: false });
  assert.deepEqual(planActionChime({ ...base, tone: "warning" }), { play: false });
});

test("the Interface sounds preference gates playback", () => {
  assert.deepEqual(
    planActionChime({
      tone: "success",
      soundsEnabled: false,
      visibility: VISIBLE,
      now: 10_000,
      lastChimeAt: 0,
    }),
    { play: false },
  );
});

test("a hidden tab stays silent", () => {
  assert.deepEqual(
    planActionChime({
      tone: "success",
      soundsEnabled: true,
      visibility: "hidden",
      now: 10_000,
      lastChimeAt: 0,
    }),
    { play: false },
  );
});

test("rapid actions never machine-gun — the 2s rate limit holds, then reopens", () => {
  const at = (now: number, lastChimeAt: number) =>
    planActionChime({ tone: "success", soundsEnabled: true, visibility: VISIBLE, now, lastChimeAt });
  assert.equal(at(10_000, 9_500).play, false); // 500ms after the last — silent
  assert.equal(at(10_000, 10_000 - CHIME_MIN_GAP_MS + 1).play, false); // just inside — silent
  assert.equal(at(10_000, 10_000 - CHIME_MIN_GAP_MS).play, true); // gap elapsed — sounds
});
