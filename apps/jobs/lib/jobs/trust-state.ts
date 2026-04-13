import "server-only";

import { createAdminSupabase } from "@/lib/supabase";
import { getCandidateProfileByUserId, getEmployerProfileBySlug, JOBS_DIVISION } from "@/lib/jobs/data";
import type { CandidateProfile, EmployerProfile } from "@/lib/jobs/types";

export type JobsTrustActor = {
  userId: string;
  role?: string | null;
};

type JobsTrustOverrideInput = {
  key: string;
  oldValue?: unknown;
  newValue: unknown;
  reason: string;
  metadata?: Record<string, unknown>;
};

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function compactObject<T extends Record<string, unknown>>(input: T) {
  return Object.fromEntries(
    Object.entries(input).filter(([, value]) => value !== undefined)
  ) as Record<string, unknown>;
}

function candidateTrustTier(profile: CandidateProfile) {
  if (profile.verificationStatus === "verified" && profile.trustScore >= 90) {
    return "premium_verified";
  }

  if (profile.verificationStatus === "verified" && profile.trustScore >= 78) {
    return "trusted";
  }

  if (
    (profile.verificationStatus === "verified" || profile.verificationStatus === "ready") &&
    profile.trustScore >= 60
  ) {
    return "verified";
  }

  return "basic";
}

function employerTrustTier(employer: EmployerProfile) {
  if (employer.verificationStatus === "verified" && employer.trustScore >= 88) {
    return "premium_verified";
  }

  if (employer.verificationStatus === "verified") {
    return "verified";
  }

  if (employer.verificationStatus === "watch") {
    return "watch";
  }

  if (employer.verificationStatus === "rejected") {
    return "rejected";
  }

  return employer.trustScore >= 72 ? "trusted" : "basic";
}

function buildCandidateTrustState(profile: CandidateProfile) {
  return {
    division: JOBS_DIVISION,
    entityType: "candidate_profile",
    entityId: profile.userId,
    label: profile.trustPassport.label,
    summary: profile.trustPassport.summary,
    riskBand: profile.trustPassport.riskBand,
    verificationStatus: profile.verificationStatus,
    completionScore: profile.completionScore,
    readinessLabel: profile.readinessLabel,
    strengths: profile.trustPassport.strengths,
    warnings: profile.trustPassport.warnings,
    nextSteps: profile.trustPassport.nextSteps,
    suspiciousFlags: profile.trustPassport.suspiciousFlags,
    signals: profile.trustPassport.signals,
    updatedAt: profile.updatedAt,
  };
}

function buildEmployerTrustState(employer: EmployerProfile) {
  return {
    division: JOBS_DIVISION,
    entityType: "employer",
    entityId: employer.slug,
    label: employer.trustPassport.label,
    summary: employer.trustPassport.summary,
    riskBand: employer.trustPassport.riskBand,
    verificationStatus: employer.verificationStatus,
    responseSlaHours: employer.responseSlaHours,
    openRoleCount: employer.openRoleCount,
    verificationNotes: employer.verificationNotes,
    strengths: employer.trustPassport.strengths,
    warnings: employer.trustPassport.warnings,
    nextSteps: employer.trustPassport.nextSteps,
    suspiciousFlags: employer.trustPassport.suspiciousFlags,
    signals: employer.trustPassport.signals,
    updatedAt: employer.updatedAt,
  };
}

async function upsertJobsTrustSnapshot(input: {
  entityType: "candidate_profile" | "employer";
  entityId: string;
  userId?: string | null;
  trustTier: string;
  trustScore: number;
  trustState: Record<string, unknown>;
  reason?: string | null;
  changeSource?: string;
  actor?: JobsTrustActor | null;
}) {
  const admin = createAdminSupabase();
  const { data, error } = await admin
    .from("jobs_trust_snapshots")
    .upsert(
      {
        entity_type: input.entityType,
        entity_id: input.entityId,
        user_id: input.userId ?? null,
        trust_tier: input.trustTier,
        trust_score: clampScore(input.trustScore),
        trust_state: input.trustState,
        updated_by: input.actor?.userId ?? null,
        update_reason: input.reason ?? null,
        metadata: compactObject({
          division: JOBS_DIVISION,
          entityType: input.entityType,
          entityId: input.entityId,
          actorRole: input.actor?.role ?? null,
          changeSource: input.changeSource ?? "system_sync",
        }),
      } as never,
      {
        onConflict: "entity_type,entity_id",
      }
    )
    .select("id, entity_type, entity_id")
    .maybeSingle();

  if (error) {
    throw new Error(error.message || "Jobs trust snapshot could not be persisted.");
  }

  return data as { id: string; entity_type: string; entity_id: string } | null;
}

async function recordJobsTrustOverride(input: {
  snapshotId?: string | null;
  entityType: "candidate_profile" | "employer";
  entityId: string;
  userId?: string | null;
  actor?: JobsTrustActor | null;
  override: JobsTrustOverrideInput;
}) {
  const admin = createAdminSupabase();
  const { error } = await admin.from("jobs_trust_override_history").insert({
    snapshot_id: input.snapshotId ?? null,
    entity_type: input.entityType,
    entity_id: input.entityId,
    user_id: input.userId ?? null,
    override_key: input.override.key,
    old_value: input.override.oldValue === undefined ? null : input.override.oldValue,
    new_value: input.override.newValue,
    reason: input.override.reason,
    changed_by: input.actor?.userId ?? null,
    metadata: compactObject({
      division: JOBS_DIVISION,
      actorRole: input.actor?.role ?? null,
      ...(input.override.metadata ?? {}),
    }),
  } as never);

  if (error) {
    throw new Error(error.message || "Jobs trust override history could not be persisted.");
  }
}

export async function syncJobsCandidateTrustSnapshot(input: {
  userId: string;
  actor?: JobsTrustActor | null;
  reason?: string | null;
  changeSource?: string;
}) {
  const profile = await getCandidateProfileByUserId(input.userId);
  if (!profile) {
    return null;
  }

  const snapshot = await upsertJobsTrustSnapshot({
    entityType: "candidate_profile",
    entityId: profile.userId,
    userId: profile.userId,
    trustTier: candidateTrustTier(profile),
    trustScore: profile.trustScore,
    trustState: buildCandidateTrustState(profile),
    reason: input.reason,
    changeSource: input.changeSource,
    actor: input.actor,
  });

  return { profile, snapshot };
}

export async function syncJobsEmployerTrustSnapshot(input: {
  employerSlug: string;
  actor?: JobsTrustActor | null;
  reason?: string | null;
  changeSource?: string;
  override?: JobsTrustOverrideInput;
}) {
  const employerProfile = await getEmployerProfileBySlug(input.employerSlug, {
    includeUnpublished: true,
  });
  const employer = employerProfile?.employer ?? null;

  if (!employer) {
    return null;
  }

  const snapshot = await upsertJobsTrustSnapshot({
    entityType: "employer",
    entityId: employer.slug,
    trustTier: employerTrustTier(employer),
    trustScore: employer.trustScore,
    trustState: buildEmployerTrustState(employer),
    reason: input.reason,
    changeSource: input.changeSource,
    actor: input.actor,
  });

  if (input.override) {
    await recordJobsTrustOverride({
      snapshotId: snapshot?.id ?? null,
      entityType: "employer",
      entityId: employer.slug,
      actor: input.actor,
      override: input.override,
    });
  }

  return { employer, snapshot };
}
