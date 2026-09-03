import { test } from "node:test";
import assert from "node:assert/strict";
import { resolveVisibleStage, stageIndex, TRUST_STAGES } from "./trust.logic";

test("canonical stage order is browse → consider → commit → pay", () => {
  assert.deepEqual([...TRUST_STAGES], ["browse", "consider", "commit", "pay"]);
});

test("cold visitor sees browse only", () => {
  const stage = resolveVisibleStage(
    { scrollDepth: 0, interactions: 0, sectionVisible: null },
    [...TRUST_STAGES],
  );
  assert.equal(stage, "browse");
});

test("a stage never precedes its predecessor: section visibility can't skip the ladder", () => {
  // User somehow lands with the pay section visible but zero interactions:
  // the ladder still caps at the stage their behavior earned (browse→consider via scroll).
  const stage = resolveVisibleStage(
    { scrollDepth: 30, interactions: 0, sectionVisible: "pay" },
    [...TRUST_STAGES],
  );
  assert.notEqual(stage, "pay");
});

test("scroll depth advances browse → consider; interaction advances → commit", () => {
  assert.equal(
    resolveVisibleStage({ scrollDepth: 45, interactions: 0, sectionVisible: null }, [...TRUST_STAGES]),
    "consider",
  );
  assert.equal(
    resolveVisibleStage({ scrollDepth: 45, interactions: 1, sectionVisible: "commit" }, [...TRUST_STAGES]),
    "commit",
  );
});

test("pay stage requires the pay section visible AND prior commitment", () => {
  assert.equal(
    resolveVisibleStage({ scrollDepth: 90, interactions: 2, sectionVisible: "pay" }, [...TRUST_STAGES]),
    "pay",
  );
});

test("a page can budget fewer stages; resolution clamps to the budget", () => {
  const stage = resolveVisibleStage(
    { scrollDepth: 90, interactions: 3, sectionVisible: "pay" },
    ["browse", "consider"],
  );
  assert.equal(stage, "consider");
});

test("stageIndex orders stages for components", () => {
  assert.ok(stageIndex("browse") < stageIndex("pay"));
});
