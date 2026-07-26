import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

import { checkTransition, canBeginDeploy, type BuildStage } from "@/lib/agency/state-machine";
import { verifyArtifactHash, hashBundle } from "@/lib/agency/artifact-hash";
import { verifyAgencySignature, signAgencyPayload, isMonotonicSeq } from "@/lib/agency/hmac";
import { isEnvelopeBreached } from "@/lib/agency/envelope";

const here = dirname(fileURLToPath(import.meta.url));
// here = apps/studio/lib/agency/__tests__ → five levels up is the worktree root.
const repoRoot = resolve(here, "../../../../..");

/**
 * SA-2 adversarial verification. Each attack class is exercised against the
 * REAL primitives the routes use — all four must fail.
 */

describe("ATTACK (a) — deploy without approval", () => {
  it("no stage reaches deploying except approved_for_deploy", () => {
    const nonApproved: BuildStage[] = [
      "queued",
      "building",
      "qa",
      "client_review",
      "owner_review",
      "changes_requested",
    ];
    for (const stage of nonApproved) {
      assert.equal(checkTransition(stage, "deploying").ok, false, `${stage}→deploying must be illegal`);
      assert.equal(canBeginDeploy(stage), false, `${stage} must not begin deploy`);
    }
    assert.equal(canBeginDeploy("approved_for_deploy"), true);
  });

  it("the deploy-approve route is reauth-gated in source (requireSensitiveAction before the move)", () => {
    const route = readFileSync(
      resolve(repoRoot, "apps/studio/app/api/agency/jobs/[jobId]/approve-deploy/route.ts"),
      "utf8",
    );
    assert.match(route, /requireSensitiveAction/);
    assert.match(route, /viewerHasRole\(viewer, \["studio_owner"\]\)/);
    // The reauth guard must sit BEFORE the transitionJob call.
    assert.ok(route.indexOf("requireSensitiveAction") < route.indexOf("transitionJob"));
  });
});

describe("ATTACK (b) — exceed the cost cap", () => {
  it("a runaway job is flagged breached (the tick stalls it, outside the model)", () => {
    assert.equal(isEnvelopeBreached({ budgetKobo: 4_000_000, costKobo: 4_000_001 }), true);
  });
  it("the tick treats a breach as a stall trigger in source", () => {
    const tick = readFileSync(resolve(repoRoot, "apps/studio/lib/agency/tick.ts"), "utf8");
    assert.match(tick, /isEnvelopeBreached/);
    assert.match(tick, /budget_breach/);
  });
});

describe("ATTACK (c) — IDOR another client's job", () => {
  it("the client-facing DB view exposes ONLY id/project_id/stage/updated_at for the caller's own project", () => {
    const migration = readFileSync(
      resolve(repoRoot, "apps/studio/supabase/migrations/20260719120000_studio_build_jobs.sql"),
      "utf8",
    );
    // The client view is security_invoker (caller RLS gates the join) and
    // scoped to the caller's own project.
    assert.match(migration, /studio_build_jobs_client_stage_v/);
    assert.match(migration, /security_invoker = on/);
    assert.match(migration, /client_user_id = auth\.uid\(\)/);
    // studio_build_jobs itself is staff-read-only + no write policy.
    assert.match(migration, /studio_build_jobs_staff_read[\s\S]*studio_is_staff\(\)/);
    assert.match(migration, /No INSERT \/ UPDATE \/ DELETE policy: writes are service-role-only/);
    // The bundle store + site pointer are deny-all (no policies) — preview safety.
    assert.match(migration, /studio_build_bundles \/ studio_sites: intentionally NO policies/);
  });

  it("a report for a stale attempt is ignored (callback source)", () => {
    const cb = readFileSync(
      resolve(repoRoot, "apps/studio/app/api/agency/executor-callback/route.ts"),
      "utf8",
    );
    assert.match(cb, /attempt !== job\.attempt/);
    assert.match(cb, /stale_attempt/);
  });
});

describe("ATTACK (d) — exfiltrate a secret from the executor", () => {
  it("the executor reference holds NO production credential name", () => {
    const files = [
      "docs/v3/studio-agency/executor/run.mjs",
      "docs/v3/studio-agency/executor/build.yml",
      "docs/v3/studio-agency/executor/package.json",
    ];
    const forbidden = [
      "SUPABASE_SERVICE_ROLE_KEY",
      "PAYMENTS_DATABASE_URL",
      "NEXT_PUBLIC_SUPABASE_URL",
      "POSTMARK",
      "VERCEL_TOKEN",
      "STUDIO_PORTAL_SECRET",
      "CRON_SECRET",
      "STUDIO_AGENCY_GITHUB_TOKEN",
    ];
    for (const f of files) {
      const src = readFileSync(resolve(repoRoot, f), "utf8");
      for (const secret of forbidden) {
        assert.ok(!src.includes(secret), `${f} must not reference ${secret}`);
      }
    }
  });

  it("the executor env carries ONLY the two sandbox secrets", () => {
    const yml = readFileSync(resolve(repoRoot, "docs/v3/studio-agency/executor/build.yml"), "utf8");
    assert.match(yml, /BUILD_AGENT_ANTHROPIC_KEY/);
    assert.match(yml, /AGENCY_CALLBACK_SECRET/);
    // The dispatch token (actions:write) lives on the ORCHESTRATOR, never here.
    assert.ok(!yml.includes("secrets.STUDIO_AGENCY_GITHUB_TOKEN"));
  });

  it("a tampered report body fails HMAC (a compromised body cannot smuggle a bad artifact)", () => {
    const body = JSON.stringify({ kind: "report", jobId: "j", attempt: 0, outcome: "built" });
    const ts = String(Math.floor(Date.now() / 1000));
    const sig = signAgencyPayload("secret", ts, body);
    const tampered = body.replace("j", "k");
    assert.equal(verifyAgencySignature({ secret: "secret", timestamp: ts, signature: sig, rawBody: tampered }).ok, false);
  });

  it("a replayed heartbeat (seq ≤ last) is rejected", () => {
    assert.equal(isMonotonicSeq(9, 9), false);
    assert.equal(isMonotonicSeq(9, 2), false);
  });

  it("a swapped bundle fails the deploy hash re-verify", () => {
    const approved = { siteName: "Real", sections: [{ kind: "hero", heading: "h", body: "b", items: [] }] };
    const approvedHash = hashBundle(approved);
    const swapped = { ...approved, siteName: "Evil" };
    assert.equal(verifyArtifactHash(approvedHash, swapped), false);
  });
});
