import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

import {
  checkTransition,
  canBeginDeploy,
  LEGAL_TRANSITIONS,
  BUILD_STAGES,
  type BuildStage,
} from "@/lib/agency/state-machine";
import { decideReviewWindowAction } from "@/lib/agency/review-window";
import { isDailyCeilingReached, resolveDailyCeilingKobo } from "@/lib/agency/daily-budget";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "../../../../..");
const read = (rel: string) => readFileSync(resolve(repoRoot, rel), "utf8");

const TICK = "apps/studio/lib/agency/tick.ts";
const DEPLOY = "apps/studio/lib/agency/deploy.ts";
const CLIENT_REVIEW_ROUTE = "apps/studio/app/api/agency/jobs/[jobId]/client-review/route.ts";
const APPROVE_ROUTE = "apps/studio/app/api/agency/jobs/[jobId]/approve-deploy/route.ts";
const CALLBACK_ROUTE = "apps/studio/app/api/agency/executor-callback/route.ts";
const MIGRATION = "apps/studio/supabase/migrations/20260720120000_studio_agency_orchestration.sql";

/**
 * SA-3 adversarial verification — the PROVE checklist. Each attack must fail
 * against the REAL coordinator code (source-level for the DB-bound paths, pure
 * for the enforced math). These sit alongside SA-2's adversarial.test.ts.
 */

describe("PROVE (1) — deploy is impossible without the one-tap + reauth, even via the orchestrator", () => {
  it("the ONLY predecessor of deploying is approved_for_deploy (machine)", () => {
    const preds = BUILD_STAGES.filter((s) => LEGAL_TRANSITIONS[s].includes("deploying"));
    assert.deepEqual(preds, ["approved_for_deploy"]);
    for (const s of BUILD_STAGES) {
      assert.equal(canBeginDeploy(s), s === "approved_for_deploy");
    }
  });

  it("the orchestrator deploy refuses any stage but approved_for_deploy / deploying", () => {
    const src = read(DEPLOY);
    assert.match(src, /function isDeployable\([\s\S]*?canBeginDeploy\(stage\)\s*\|\|\s*stage === "deploying"/);
    assert.match(src, /if \(!isDeployable\(job\.stage\)\) return \{ ok: false, reason: `not_deployable/);
  });

  it("the ONLY producer of approved_for_deploy is the reauth-gated approve route", () => {
    const approve = read(APPROVE_ROUTE);
    // requireSensitiveAction (password step-up) runs BEFORE the state move.
    assert.match(approve, /requireSensitiveAction/);
    assert.ok(approve.indexOf("requireSensitiveAction") < approve.indexOf('to: "approved_for_deploy"'));
    // The tick NEVER transitions a job into approved_for_deploy itself.
    assert.ok(!read(TICK).includes('to: "approved_for_deploy"'));
  });

  it("the automated deploy is flag-gated (a killed agency pauses deploys too)", () => {
    const tick = read(TICK);
    // autoDeploy short-circuits when the kill switch is off.
    assert.match(tick, /async function autoDeploy[\s\S]*?if \(!isStudioAgencyEnabled\(\)\) return;/);
  });
});

describe("PROVE (2) — the hash pin refuses a swapped artifact on the automated path", () => {
  it("the deploy binds to the WRITE-ONCE owner-approved hash and FAILS CLOSED (no fallback)", () => {
    const src = read(DEPLOY);
    // approvedHash comes ONLY from approved_artifact_hash — no fallback to the
    // mutable column. Its absence at a post-approval stage fails closed.
    assert.match(src, /const approvedHash = job\.approvedArtifactHash;/);
    assert.ok(!src.includes("job.approvedArtifactHash ?? job.artifactHash"), "no fallback to the mutable hash");
    assert.match(src, /if \(!approvedHash\) \{\s*return failDeploy\(job, host, "no_approved_hash"\)/);
    // A divergence between the approved hash and the current artifact_hash (a
    // post-approval swap attempt) also fails closed — never deploys.
    assert.match(src, /if \(job\.artifactHash && approvedHash !== job\.artifactHash\) \{\s*return failDeploy\(job, host, "artifact_hash_diverged"\)/);
    // The stored bundle re-verify still precedes goLive, and goLive gets the same hash.
    assert.ok(src.indexOf("verifyStoredBundleHash(approvedHash)") < src.indexOf("goLive({"));
    assert.match(src, /goLive\(\{ host, jobId: job\.id, projectId: job\.projectId, approvedHash \}\)/);
  });

  it("the reauth-gated approval captures the approved hash write-once", () => {
    assert.match(read(APPROVE_ROUTE), /patch: \{ approved_artifact_hash: job\.artifactHash \}/);
  });

  it("the executor callback CANNOT mutate the artifact after the build phase (swap vector closed)", () => {
    const cb = read(CALLBACK_ROUTE);
    // A report for any non-buildable stage is rejected before storing or mutating.
    assert.match(cb, /BUILDABLE_STAGES = \["queued", "dispatching", "building"\]/);
    assert.match(cb, /if \(!BUILDABLE_STAGES\.includes\(stage\)\) \{[\s\S]*?report_stale_stage[\s\S]*?stale_stage/);
    // The guard sits at the TOP of handleReport, before storeBundle / any update.
    assert.ok(cb.indexOf("!BUILDABLE_STAGES.includes(stage)") < cb.indexOf("storeBundle("));
  });

  it("the DB trigger makes artifact_hash write-once past the build phase (second wall)", () => {
    const mig = read(MIGRATION);
    assert.match(mig, /artifact_hash is WRITE-ONCE after the build phase/);
    assert.match(mig, /old\.stage not in \('queued','dispatching','building'\)\s*and new\.artifact_hash is distinct from old\.artifact_hash/);
    assert.match(mig, /approved_artifact_hash is write-once/);
  });
});

describe("PROVE (3) — a stage cannot advance on an unverified prior stage", () => {
  it("QA re-hashes the STORED bundle and adds an integrity gate before client_review", () => {
    const tick = read(TICK);
    // QA reads the stored bundle + re-verifies its hash; a mismatch fails the report.
    assert.match(tick, /verifyStoredBundleHash\(job\.artifactHash\)/);
    assert.match(tick, /artifact_integrity/);
    assert.match(tick, /report\.ok = false;/);
    // The advance to client_review happens only on report.ok.
    assert.ok(tick.indexOf("if (report.ok)") < tick.indexOf('to: "client_review"'));
  });
});

describe("PROVE (4) — client silence escalates and NEVER auto-advances", () => {
  it("the review-window decision has no 'advance' path (pure)", () => {
    const kinds = new Set<string>();
    for (let day = 0; day <= 10; day += 1) {
      for (let sent = 0; sent <= 4; sent += 1) {
        kinds.add(
          decideReviewWindowAction({ enteredAtMs: 1, now: 1 + day * 86_400_000, remindersSent: sent, escalated: false }).kind,
        );
      }
    }
    assert.ok(!kinds.has("advance" as never));
    assert.deepEqual([...kinds].sort(), ["escalate", "none", "remind"]);
  });

  it("the tick's client-review sweep never transitions a job to owner_review", () => {
    // The ONLY client_review → owner_review edge is the client's explicit approval
    // in the client-review route — never a timer in the tick.
    assert.ok(!read(TICK).includes('to: "owner_review"'));
    assert.match(read(CLIENT_REVIEW_ROUTE), /to: "owner_review"/);
  });
});

describe("PROVE (5) — the cost cap aborts a runaway arc", () => {
  it("the daily ceiling reserves in-tick committed spend (not just accrued) before dispatch", () => {
    const tick = read(TICK);
    // The gate reserves this job's worst-case envelope against accrued + already-
    // committed-this-tick spend — so N jobs in one tick cannot each read spent≈0.
    assert.match(tick, /isDailyCeilingReached\(ceiling\.spentKobo \+ ceiling\.committedKobo \+ job\.budgetKobo, ceiling\.ceilingKobo\)/);
    // The reservation accrues on each successful dispatch.
    assert.match(tick, /ceiling\.committedKobo \+= job\.budgetKobo;/);
    // The gate is checked BEFORE the queued→dispatching move.
    assert.ok(tick.indexOf("isDailyCeilingReached(ceiling.spentKobo") < tick.indexOf('to: "dispatching"'));
    assert.match(tick, /daily_ceiling_hold/);
  });

  it("a runaway arc of max-cap jobs trips the ceiling (pure)", () => {
    const ceiling = resolveDailyCeilingKobo({});
    assert.equal(isDailyCeilingReached(3 * 10_000_000, ceiling), true);
  });

  it("a per-job envelope breach still stalls a spending job (belt and braces)", () => {
    const tick = read(TICK);
    assert.match(tick, /isEnvelopeBreached/);
    assert.match(tick, /budget_breach/);
  });
});

describe("PROVE (6) — IDOR another client's orchestration state fails", () => {
  it("the client-review route re-verifies ownership BEFORE any state move", () => {
    const route = read(CLIENT_REVIEW_ROUTE);
    assert.match(route, /clientOwnsProject\(admin, projectRow, viewer\.user\.id, viewer\.normalizedEmail\)/);
    // Ownership check precedes the first transitionJob.
    assert.ok(route.indexOf("clientOwnsProject") < route.indexOf("transitionJob"));
    // A non-owner is refused.
    assert.match(route, /if \(!owns\) return NextResponse\.json\(\{ ok: false, error: "forbidden" \}, \{ status: 403 \}\)/);
  });

  it("the decisions inbox is deny-RLS: staff read only, service-role write, no client read", () => {
    const mig = read(MIGRATION);
    assert.match(mig, /alter table public\.studio_agency_decisions enable row level security/);
    assert.match(mig, /studio_agency_decisions_staff_read[\s\S]*studio_is_staff\(\)/);
    assert.match(mig, /No INSERT \/ UPDATE \/ DELETE policy: writes are service-role-only/);
  });
});

describe("PROVE (7) — replaying a stage / re-running a deploy is idempotent", () => {
  it("a live (or terminal) job is NOT re-deployable → a replayed deploy is a no-op", () => {
    // isDeployable only admits approved_for_deploy + deploying; live is excluded.
    const src = read(DEPLOY);
    assert.match(src, /stage === "deploying"/);
    // Prove via the machine that live never re-enters deploying.
    assert.equal(checkTransition("live", "deploying").ok, false);
  });

  it("the deploy records completion BEFORE flipping the job to live (crash-safe resume)", () => {
    const src = read(DEPLOY);
    assert.ok(src.indexOf('appendBuildEvent(job.id, "deployed"') < src.indexOf('to: "live"'));
  });

  it("the decisions inbox is one-pending-per-(job,kind) (idempotent server-initiated proposals)", () => {
    assert.match(read(MIGRATION), /studio_agency_decisions_one_pending[\s\S]*where\s+status = 'pending'/);
  });
});

describe("PROVE (8) — the machine still forbids every illegal jump", () => {
  it("aftercare is terminal; live only reaches aftercare", () => {
    assert.deepEqual(LEGAL_TRANSITIONS.aftercare, []);
    assert.deepEqual(LEGAL_TRANSITIONS.live, ["aftercare"]);
  });

  it("no client-reachable stage jumps toward deploy", () => {
    for (const s of ["client_review", "qa", "changes_requested"] as BuildStage[]) {
      assert.equal(checkTransition(s, "deploying").ok, false);
      assert.equal(checkTransition(s, "approved_for_deploy").ok, false);
    }
  });
});
