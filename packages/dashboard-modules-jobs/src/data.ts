import "server-only";

import type { UnifiedViewer } from "@henryco/auth";
import { createDataAdminClient } from "@henryco/data";
import { henryDomainHost } from "@henryco/config";
import {
  applyVerificationTrustControls,
  normalizeVerificationStatus,
} from "@henryco/trust";

/**
 * Module-local data layer for the jobs (Henry Onyx Jobs) home widgets.
 *
 * Every read here uses the typed admin client from `@henryco/data`;
 * nothing mutates state. The four surfaced metrics are computed with
 * the EXACT logic the live `/jobs` surface uses
 * (`apps/account/lib/jobs-module.ts` → `getJobsModuleData`) so the
 * widget numbers never drift from the full page:
 *
 *   - `applicationsCount`     → `applications.length`   (stats id `applications`)
 *   - `savedJobsCount`        → `savedJobs.length`      (stats id `saved`)
 *   - `profileReadiness`      → `profile.trustScore`    (stats id `readiness`)
 *   - `recruiterUpdatesCount` → `recruiterFeed.length`  (stats id `updates`)
 *
 * The module package cannot import the app's `@/lib/jobs-module`
 * (that would be an apps → package circular dependency), so the metric
 * computations are ported here against the same `customer_activity` /
 * `customer_profiles` / `customer_documents` / `customer_notifications`
 * rows. No value is fabricated — every number is read from the live
 * tables.
 */

const JOBS_DIVISION = "jobs";
const JOBS_ACTIVITY_PROFILE = "jobs_candidate_profile";
const JOBS_ACTIVITY_APPLICATION = "jobs_application";
const JOBS_ACTIVITY_SAVED = "jobs_saved_post";

/** Canonical live account-shell route for the jobs surface. */
export const JOBS_HOME_HREF = "/jobs";

export type JobsSnapshot = {
  /** Active applications — `applications.length` on the live `/jobs` page. */
  applicationsCount: number;
  /** Saved roles with a resolvable slug — `savedJobs.length`. */
  savedJobsCount: number;
  /** Profile readiness percent (0-100) — `profile.trustScore`. */
  profileReadiness: number;
  /** Human band for `profileReadiness` — matches the live readiness label. */
  readinessLabel: string;
  /** Recruiter updates in the feed (capped at 8) — `recruiterFeed.length`. */
  recruiterUpdatesCount: number;
  /** Whether a resume document is on file (sharpens the readiness widget copy). */
  hasResume: boolean;
  /** True when the viewer has any live jobs signal at all. */
  hasActivity: boolean;
};

// ---------------------------------------------------------------------------
// Value coercion helpers — ported verbatim from `jobs-module.ts` so the
// derived metrics are bit-for-bit identical to the live `/jobs` page.
// ---------------------------------------------------------------------------

function asText(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asNullableText(value: unknown): string | null {
  const text = typeof value === "string" ? value.trim() : "";
  return text || null;
}

function asObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  return value as Record<string, unknown>;
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.map((item) => asText(item).trim()).filter(Boolean)
    : [];
}

function asObjectArray(value: unknown): Array<Record<string, unknown>> {
  return Array.isArray(value) ? value.map(asObject) : [];
}

// ---------------------------------------------------------------------------
// Profile readiness — `completionScore` + `trustScore` ports.
// ---------------------------------------------------------------------------

function completionScore(input: {
  base: Record<string, unknown>;
  profile: Record<string, unknown>;
  documents: Array<Record<string, unknown>>;
}): number {
  let score = 0;
  if (asNullableText(input.base.full_name)) score += 12;
  if (asNullableText(input.base.phone)) score += 10;
  if (asNullableText(input.profile.headline)) score += 12;
  if (asNullableText(input.profile.summary)) score += 12;
  if (asNullableText(input.profile.location)) score += 8;
  if (asStringArray(input.profile.skills).length >= 4) score += 14;
  if (asObjectArray(input.profile.workHistory).length > 0) score += 12;
  if (asObjectArray(input.profile.education).length > 0) score += 8;
  if (asStringArray(input.profile.portfolioLinks).length > 0) score += 6;
  if (
    input.documents.some(
      (document) =>
        asText(asObject(document.metadata).documentKind) === "resume",
    )
  ) {
    score += 16;
  }
  return Math.min(score, 100);
}

function trustScore(input: {
  completionScoreValue: number;
  profile: Record<string, unknown>;
  documents: Array<Record<string, unknown>>;
  verificationStatus: unknown;
}): number {
  let score = input.completionScoreValue;
  if (normalizeVerificationStatus(input.verificationStatus) === "verified") {
    score += 18;
  }
  if (
    input.documents.some(
      (document) =>
        asText(asObject(document.metadata).documentKind) === "certification",
    )
  ) {
    score += 6;
  }
  if (
    input.documents.some(
      (document) =>
        asText(asObject(document.metadata).documentKind) === "portfolio",
    ) ||
    asStringArray(input.profile.portfolioLinks).length > 0
  ) {
    score += 4;
  }

  return applyVerificationTrustControls({
    verificationStatus: input.verificationStatus,
    baseScore: score,
    baseTier:
      score >= 88
        ? "premium_verified"
        : score >= 68
          ? "trusted"
          : score >= 45
            ? "verified"
            : "basic",
    verifiedBonus: 0,
    caps: {
      none: { maxScore: 54, maxTier: "basic" },
      pending: { maxScore: 68, maxTier: "verified" },
      rejected: { maxScore: 36, maxTier: "basic" },
    },
  }).score;
}

function readinessLabel(score: number): string {
  if (score >= 88) return "Interview-ready";
  if (score >= 68) return "Strong profile";
  if (score >= 45) return "Needs proof";
  return "Needs structure";
}

// ---------------------------------------------------------------------------
// Recruiter feed — `notificationBelongsToJobs` port.
// ---------------------------------------------------------------------------

function notificationBelongsToJobs(row: Record<string, unknown>): boolean {
  const division = asText(row.division);
  const category = asText(row.category);
  const referenceType = asText(row.reference_type);
  const actionUrl = asText(row.action_url);
  const title = asText(row.title).toLowerCase();
  const body = asText(row.body).toLowerCase();

  return (
    division === JOBS_DIVISION ||
    category === JOBS_DIVISION ||
    referenceType.startsWith("jobs_") ||
    actionUrl.includes(henryDomainHost("jobs")) ||
    actionUrl.includes("/candidate/") ||
    actionUrl.includes("/jobs/") ||
    title.includes("application") ||
    title.includes("recruiter") ||
    body.includes("henryco jobs")
  );
}

/**
 * Build the jobs snapshot for the current viewer. Returns `null` when
 * the viewer is not a customer-context viewer (owner / staff lanes load
 * customer-scoped jobs rows only — mirrors `loadMarketplaceSnapshot`).
 */
export async function loadJobsSnapshot(
  viewer: UnifiedViewer,
): Promise<JobsSnapshot | null> {
  if (viewer.kind !== "customer") return null;
  const client = createDataAdminClient();
  const userId = viewer.user.id;

  const [
    profileRes,
    profileActivityRes,
    documentsRes,
    applicationsRes,
    savedRes,
    notificationsRes,
  ] = await Promise.all([
    client
      .from("customer_profiles")
      .select("full_name, phone, verification_status")
      .eq("id", userId)
      .maybeSingle(),
    client
      .from("customer_activity")
      .select("metadata")
      .eq("user_id", userId)
      .eq("division", JOBS_DIVISION)
      .eq("activity_type", JOBS_ACTIVITY_PROFILE)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    client
      .from("customer_documents")
      .select("metadata")
      .eq("user_id", userId)
      .eq("division", JOBS_DIVISION),
    client
      .from("customer_activity")
      .select("id")
      .eq("user_id", userId)
      .eq("division", JOBS_DIVISION)
      .eq("activity_type", JOBS_ACTIVITY_APPLICATION)
      .neq("status", "withdrawn"),
    client
      .from("customer_activity")
      .select("metadata")
      .eq("user_id", userId)
      .eq("division", JOBS_DIVISION)
      .eq("activity_type", JOBS_ACTIVITY_SAVED)
      .eq("status", "saved"),
    client
      .from("customer_notifications")
      .select("division, category, reference_type, action_url, title, body")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  const profileRow = asObject(profileRes.data);
  const profileActivity = asObject(profileActivityRes.data);
  const profile = asObject(profileActivity.metadata);
  const documents = (documentsRes.data ?? []) as Array<Record<string, unknown>>;

  // applications.length — every non-withdrawn application row.
  const applicationsCount = (applicationsRes.data ?? []).length;

  // savedJobs.length — saved rows whose role resolves to a slug. The live
  // page keeps a saved role only when its role `slug` is truthy, and the
  // resolved/fallback role slug is `metadata.jobSlug`, so mirror that filter.
  const savedJobsCount = (
    (savedRes.data ?? []) as Array<Record<string, unknown>>
  ).filter((row) => Boolean(asText(asObject(row.metadata).jobSlug))).length;

  // profile.trustScore — completion + verification controls.
  const completion = completionScore({
    base: profileRow,
    profile,
    documents,
  });
  const profileReadiness = trustScore({
    completionScoreValue: completion,
    profile,
    documents,
    verificationStatus: profileRow.verification_status,
  });
  const hasResume = documents.some(
    (document) =>
      asText(asObject(document.metadata).documentKind) === "resume",
  );

  // recruiterFeed.length — jobs-relevant notifications plus one entry per
  // application, capped at 8 (the live feed's `.slice(0, 8)`).
  const jobsNotificationCount = (
    (notificationsRes.data ?? []) as Array<Record<string, unknown>>
  ).filter((row) => notificationBelongsToJobs(row)).length;
  const recruiterUpdatesCount = Math.min(
    8,
    jobsNotificationCount + applicationsCount,
  );

  return {
    applicationsCount,
    savedJobsCount,
    profileReadiness,
    readinessLabel: readinessLabel(profileReadiness),
    recruiterUpdatesCount,
    hasResume,
    hasActivity:
      applicationsCount > 0 ||
      savedJobsCount > 0 ||
      recruiterUpdatesCount > 0 ||
      profileReadiness > 0,
  };
}

// ---------------------------------------------------------------------------
// Command-palette quick actions — single source of truth shared by the
// module's palette entries. Real, live deep-links into the jobs surface.
// ---------------------------------------------------------------------------

export type QuickActionGroup = "Open" | "Create" | "Search";

export type QuickAction = {
  id: string;
  label: string;
  description: string;
  href: string;
  group: QuickActionGroup;
  keywords: ReadonlyArray<string>;
};

export function getJobsQuickActions(): ReadonlyArray<QuickAction> {
  return [
    {
      id: "jobs.browse",
      label: "Browse jobs",
      description: "Find roles across the Henry Onyx network.",
      href: JOBS_HOME_HREF,
      group: "Search",
      keywords: ["jobs", "browse", "roles", "vacancies", "careers"],
    },
    {
      id: "jobs.applications",
      label: "My applications",
      description: "Track where each of your applications stands.",
      href: JOBS_HOME_HREF,
      group: "Open",
      keywords: ["applications", "status", "applied", "history"],
    },
    {
      id: "jobs.interviews",
      label: "Interviews",
      description: "Join and prepare for scheduled interviews.",
      href: JOBS_HOME_HREF,
      group: "Open",
      keywords: ["interview", "schedule", "session", "meeting"],
    },
  ];
}
