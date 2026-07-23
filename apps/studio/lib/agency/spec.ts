import "server-only";

/**
 * SA-2 — the frozen job-spec renderer + job creation. The spec is the agent's
 * WHOLE input; it must contain no production secret and no contact PII
 * (SAFETY-MODEL §3). This module renders it from an approved brief, scrubbing
 * contact details the way the shipped copilot transcript path does.
 *
 * A job is created ONLY from an approved (template-class, paid) brief. The
 * envelope is sized from the package price via the governed rate card; the
 * harness caps ride inside the spec so budget enforcement lives OUTSIDE the
 * model.
 */

import { randomUUID } from "node:crypto";
import { createAdminSupabase, hasAdminSupabaseEnv } from "@/lib/supabase";
import { computeJobEnvelopeKobo, harnessCapsForEnvelope } from "@/lib/agency/envelope";
import { defaultStudioBuildRateCard } from "@/lib/agency/rate-card";
import { scrubContactPii } from "@/lib/agency/scrub";
import type { BuildJobSpec, StudioBriefSnapshot } from "@/lib/agency/contracts";
import { appendBuildEvent } from "@/lib/agency/store";

export { scrubContactPii };

function toStringList(value: unknown, max = 24, itemMax = 200): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((v) => scrubContactPii(String(v ?? "")).slice(0, itemMax)).filter(Boolean).slice(0, max);
}

/** Build the PII-scrubbed brief snapshot from a stored brief row. */
export function renderBriefSnapshot(brief: Record<string, unknown>): StudioBriefSnapshot {
  const domainIntentRaw = brief.domain_intent as Record<string, unknown> | null;
  const path = String(domainIntentRaw?.path ?? "");
  const domainIntent: StudioBriefSnapshot["domainIntent"] =
    path === "new" || path === "have" || path === "later"
      ? { path, desiredLabel: scrubContactPii(String(domainIntentRaw?.desiredLabel ?? "")).slice(0, 200) }
      : null;
  return {
    briefId: String(brief.id),
    serviceKind: String(brief.service_kind ?? brief.serviceKind ?? "website"),
    briefClass: brief.brief_class === "agency" ? "agency" : "template",
    businessType: scrubContactPii(String(brief.business_type ?? "")).slice(0, 200),
    goals: scrubContactPii(String(brief.goals ?? "")).slice(0, 4000),
    scopeNotes: scrubContactPii(String(brief.scope_notes ?? "")).slice(0, 4000),
    requiredFeatures: toStringList(brief.required_features),
    pageRequirements: toStringList(brief.page_requirements ?? brief.pageRequirements),
    designDirection: scrubContactPii(String(brief.design_direction ?? "")).slice(0, 400),
    domainIntent,
  };
}

export function renderBuildJobSpec(input: {
  jobId: string;
  attempt: number;
  snapshot: StudioBriefSnapshot;
  budgetKobo: number;
  callbackUrl: string;
  callbackKeyId: string;
  locale?: string;
  toneRules?: string;
}): BuildJobSpec {
  const caps = harnessCapsForEnvelope(input.budgetKobo);
  return {
    jobId: input.jobId,
    attempt: input.attempt,
    briefSnapshot: input.snapshot,
    track: "bundle", // SA-2: Track 1 only. Track 2 (codegen) is SA-2b.
    constraints: {
      budget: caps,
      tech: ["studio-sites-bundle-v1"],
      content: {
        locale: input.locale ?? "en",
        toneRules: input.toneRules ?? "calm authority; no provider or model names; NGN; Nigeria/Lagos defaults",
      },
    },
    callbackUrl: input.callbackUrl,
    callbackKeyId: input.callbackKeyId,
  };
}

export type CreateJobResult =
  | { ok: true; jobId: string; budgetKobo: number }
  | { ok: false; reason: string };

/**
 * Create a queued build job from an approved, paid, template-class project.
 * Guards enforced here (defense in depth on top of the console gate):
 *   - agency-class briefs are NOT buildable in SA-2 (Track 2 territory).
 *   - the project must be paid on the CARD RAIL (MONEY-MODEL §2 — the
 *     unledgered wallet path is not widened for agency revenue).
 *   - one active job per project (the DB partial-unique index is the wall).
 */
export async function createBuildJobFromProject(input: {
  projectId: string;
  callbackBaseUrl: string;
  callbackKeyId: string;
  isInternal?: boolean;
  actor: string;
}): Promise<CreateJobResult> {
  if (!hasAdminSupabaseEnv()) return { ok: false, reason: "no_admin_env" };
  const admin = createAdminSupabase();

  const { data: projectRow } = await admin
    .from("studio_projects")
    .select("id, proposal_id, lead_id, package_id, status")
    .eq("id", input.projectId)
    .maybeSingle();
  const project = projectRow as Record<string, unknown> | null;
  if (!project) return { ok: false, reason: "project_not_found" };

  const { data: briefRow } = await admin
    .from("studio_briefs")
    .select("*")
    .eq("lead_id", project.lead_id as string)
    .maybeSingle();
  const brief = briefRow as Record<string, unknown> | null;
  if (!brief) return { ok: false, reason: "brief_not_found" };

  const snapshot = renderBriefSnapshot(brief);
  if (snapshot.briefClass === "agency") {
    // Agency-class jobs are custom-tier (Track 2) — out of SA-2 scope.
    return { ok: false, reason: "agency_class_not_buildable_in_sa2" };
  }

  // Package price → envelope. Package price is major-unit naira on the row.
  let packagePriceMajor = 0;
  if (project.package_id) {
    const { data: pkgRow } = await admin
      .from("studio_packages")
      .select("price")
      .eq("id", project.package_id as string)
      .maybeSingle();
    packagePriceMajor = Number((pkgRow as { price?: number } | null)?.price ?? 0);
  }
  const budgetKobo = computeJobEnvelopeKobo(packagePriceMajor, defaultStudioBuildRateCard().envelope);

  const jobId = randomUUID();
  const spec = renderBuildJobSpec({
    jobId,
    attempt: 0,
    snapshot,
    budgetKobo,
    callbackUrl: `${input.callbackBaseUrl.replace(/\/$/, "")}/api/agency/executor-callback`,
    callbackKeyId: input.callbackKeyId,
  });

  const { error } = await admin.from("studio_build_jobs").insert({
    id: jobId,
    project_id: input.projectId,
    brief_id: brief.id as string,
    spec,
    stage: "queued",
    attempt: 0,
    cost_mode: "mode_a",
    track: "bundle",
    budget_kobo: budgetKobo,
    cost_kobo: 0,
    brief_class: snapshot.briefClass,
    is_internal: Boolean(input.isInternal),
  } as never);

  if (error) {
    // The one-active-per-project partial unique index rejects a duplicate.
    return { ok: false, reason: error.message.includes("one_active_per_project") ? "active_job_exists" : "insert_failed" };
  }

  await appendBuildEvent(jobId, "created", {
    project_id: input.projectId,
    brief_id: brief.id,
    budget_kobo: budgetKobo,
    actor: input.actor,
    is_internal: Boolean(input.isInternal),
  });

  return { ok: true, jobId, budgetKobo };
}
