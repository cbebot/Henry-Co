import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getJobsViewer } from "@/lib/auth";
import { createAdminSupabase } from "@/lib/supabase";

/**
 * V3 PASS 21 — Skill verification submit/decision endpoint.
 *
 * POST creates a new jobs_skill_verifications row (candidate self-
 * attestation). Verifier decisions land via a separate /decision sub-
 * route added in the recruiter surface scope.
 *
 * Body: { skillLabel, skillId?, evidenceType, evidenceUrl?,
 *          evidencePayload? }
 *
 * The owner-write RLS policy already restricts insert to auth.uid().
 * We still pre-validate the wire to short-circuit obvious shape errors.
 */
export const dynamic = "force-dynamic";

const ALLOWED_EVIDENCE_TYPES = new Set([
  "self_attest",
  "portfolio_url",
  "certificate",
  "employer_attest",
  "assessment_score",
]);

export async function POST(request: Request) {
  try {
    const viewer = await getJobsViewer();
    if (!viewer.user) {
      return NextResponse.json(
        { error: "unauthorized", message: "Sign in to submit verifications." },
        { status: 401 },
      );
    }

    let payload: Record<string, unknown> = {};
    try {
      payload = (await request.json()) as Record<string, unknown>;
    } catch {
      return NextResponse.json(
        { error: "invalid_request", message: "Invalid request body." },
        { status: 400 },
      );
    }

    const skillLabel =
      typeof payload.skillLabel === "string"
        ? payload.skillLabel.trim()
        : "";
    const evidenceType =
      typeof payload.evidenceType === "string"
        ? payload.evidenceType.trim()
        : "";

    if (!skillLabel || !evidenceType) {
      return NextResponse.json(
        {
          error: "missing_fields",
          message: "skillLabel and evidenceType are required.",
        },
        { status: 400 },
      );
    }

    if (!ALLOWED_EVIDENCE_TYPES.has(evidenceType)) {
      return NextResponse.json(
        {
          error: "invalid_evidence_type",
          message: "Unsupported evidence type.",
        },
        { status: 400 },
      );
    }

    const evidenceUrl =
      typeof payload.evidenceUrl === "string"
        ? payload.evidenceUrl.trim()
        : null;
    if (
      evidenceUrl &&
      !evidenceUrl.startsWith("http://") &&
      !evidenceUrl.startsWith("https://")
    ) {
      return NextResponse.json(
        {
          error: "invalid_evidence_url",
          message: "evidenceUrl must start with http:// or https://",
        },
        { status: 400 },
      );
    }

    const skillId =
      typeof payload.skillId === "string" ? payload.skillId.trim() : null;
    const evidencePayload =
      payload.evidencePayload &&
      typeof payload.evidencePayload === "object" &&
      !Array.isArray(payload.evidencePayload)
        ? (payload.evidencePayload as Record<string, unknown>)
        : {};

    const admin = createAdminSupabase();
    const id = randomUUID();
    const { data, error } = await admin
      .from("jobs_skill_verifications")
      .insert({
        id,
        candidate_user_id: viewer.user.id,
        skill_id: skillId || null,
        skill_label: skillLabel,
        evidence_type: evidenceType,
        evidence_url: evidenceUrl,
        evidence_payload: evidencePayload,
        status: "pending",
      })
      .select("*")
      .single();

    if (error || !data) {
      console.error(
        "[verifications/skill] insert error:",
        error?.message || "no row",
      );
      return NextResponse.json(
        {
          error: "create_failed",
          message: "Couldn't save verification.",
        },
        { status: 500 },
      );
    }

    // Project the row — the candidate needs confirmation and the pending
    // status, not the table's full column set.
    const row = data as Record<string, unknown>;
    return NextResponse.json({
      verification: {
        id: row.id,
        skillLabel: row.skill_label,
        evidenceType: row.evidence_type,
        status: row.status,
        createdAt: row.created_at,
      },
    });
  } catch (error) {
    console.error("[verifications/skill] internal error:", error);
    return NextResponse.json(
      { error: "internal_error", message: "Internal server error." },
      { status: 500 },
    );
  }
}
