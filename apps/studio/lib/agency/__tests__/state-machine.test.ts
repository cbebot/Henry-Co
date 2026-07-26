import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  checkTransition,
  isLegalTransition,
  canBeginDeploy,
  DEPLOY_APPROVED_STAGE,
  LEGAL_TRANSITIONS,
  BUILD_STAGES,
  type BuildStage,
} from "@/lib/agency/state-machine";

describe("state machine — the single choke point", () => {
  it("allows the happy path build → live", () => {
    assert.ok(isLegalTransition("queued", "dispatching"));
    assert.ok(isLegalTransition("dispatching", "building"));
    assert.ok(isLegalTransition("building", "qa"));
    assert.ok(isLegalTransition("qa", "client_review"));
    assert.ok(isLegalTransition("client_review", "owner_review"));
    assert.ok(isLegalTransition("owner_review", "approved_for_deploy"));
    assert.ok(isLegalTransition("approved_for_deploy", "deploying"));
    assert.ok(isLegalTransition("deploying", "live"));
    assert.ok(isLegalTransition("live", "aftercare"));
  });

  it("has NO edge from qa or client_review straight to deploying (the hard gate)", () => {
    assert.equal(isLegalTransition("qa", "deploying"), false);
    assert.equal(isLegalTransition("client_review", "deploying"), false);
    assert.equal(isLegalTransition("owner_review", "deploying"), false);
    // The ONLY predecessor of deploying is approved_for_deploy.
    const predecessorsOfDeploying = BUILD_STAGES.filter((s) => LEGAL_TRANSITIONS[s].includes("deploying"));
    assert.deepEqual(predecessorsOfDeploying, ["approved_for_deploy"]);
  });

  it("only approved_for_deploy can begin a deploy", () => {
    for (const stage of BUILD_STAGES) {
      assert.equal(canBeginDeploy(stage), stage === DEPLOY_APPROVED_STAGE);
    }
  });

  it("same-stage is an idempotent no-op, not a legal transition", () => {
    const res = checkTransition("building", "building");
    assert.equal(res.ok, false);
    if (!res.ok) assert.equal(res.reason, "same_stage");
  });

  it("rejects arbitrary illegal jumps", () => {
    assert.equal(isLegalTransition("queued", "live"), false);
    assert.equal(isLegalTransition("cancelled", "queued"), false);
    assert.equal(isLegalTransition("live", "deploying"), false);
    assert.equal(isLegalTransition("aftercare", "queued"), false);
  });

  it("failure stages can only re-arm to queued or close", () => {
    for (const failed of ["build_failed", "qa_failed"] as BuildStage[]) {
      assert.ok(isLegalTransition(failed, "queued"));
      assert.ok(isLegalTransition(failed, "cancelled"));
      assert.equal(isLegalTransition(failed, "deploying"), false);
      assert.equal(isLegalTransition(failed, "live"), false);
    }
  });
});
