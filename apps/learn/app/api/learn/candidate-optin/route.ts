import { NextResponse } from "next/server";
import { requireSensitiveAction } from "@henryco/auth/server/sensitive-action-guard";
import { emitEvent } from "@henryco/observability/events";
import { writeAuditLog, type AuditLogSupabaseClient } from "@henryco/observability/audit-log";
import { createAdminSupabase } from "@/lib/supabase";
import { createSupabaseServer } from "@/lib/supabase/server";
import { normalizeEmail } from "@/lib/env";

/**
 * V3-56 — learner career-visibility consent (S4).
 *
 * POST { courseId, action: 'opt_in' | 'opt_out', courseSlug?, visibility? }.
 *
 * The opt-in row IS the consent record (NDPR/GDPR). Opt-in lists a verified
 * completer to employers gating/hiring on the course; opt-out sets revoked_at
 * immediately (total removal). Sensitive (changes who can see the learner) →
 * requireSensitiveAction (V3-02), audited; opt-in emits henry.learn.candidate.listed.
 */
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: "unauthorized", message: "Sign in to manage your visibility." },
        { status: 401 },
      );
    }

    const admin = createAdminSupabase();
    const guard = await requireSensitiveAction(request, {
      action: "learn.candidate.optin",
      entityType: "learn_candidate_optin",
      resolveUser: async () => user,
      userId: (u) => u.id,
      auditClient: admin as unknown as AuditLogSupabaseClient,
    });
    if (!guard.ok) return guard.response;

    let payload: Record<string, unknown> = {};
    try {
      payload = (await request.json()) as Record<string, unknown>;
    } catch {
      return NextResponse.json(
        { error: "invalid_request", message: "Invalid request body." },
        { status: 400 },
      );
    }

    const courseId = typeof payload.courseId === "string" ? payload.courseId.trim() : "";
    const courseSlug = typeof payload.courseSlug === "string" ? payload.courseSlug.trim() : null;
    const action = payload.action === "opt_out" ? "opt_out" : "opt_in";
    const visibility = payload.visibility === "private" ? "private" : "employers";
    if (!courseId) {
      return NextResponse.json(
        { error: "missing_fields", message: "courseId is required." },
        { status: 400 },
      );
    }

    // A completer only: opting in requires a real issued certificate for the course.
    const certificate = await admin
      .from("learn_certificates")
      .select("id")
      .eq("user_id", user.id)
      .eq("course_id", courseId)
      .limit(1)
      .maybeSingle();
    if (action === "opt_in" && !certificate.data) {
      return NextResponse.json(
        { error: "not_completed", message: "Complete the course before listing yourself to employers." },
        { status: 403 },
      );
    }

    const normalizedEmail = normalizeEmail(user.email);
    const nowIso = new Date().toISOString();

    if (action === "opt_out") {
      const { error } = await admin
        .from("learn_candidate_optins")
        .update({ revoked_at: nowIso } as never)
        .eq("user_id", user.id)
        .eq("course_id", courseId)
        .is("revoked_at", null);
      if (error) {
        return NextResponse.json(
          { error: "save_failed", message: "Couldn't update your visibility." },
          { status: 500 },
        );
      }
      await writeAuditLog(admin as unknown as AuditLogSupabaseClient, {
        action: "learn.candidate.opt_out",
        entityType: "learn_candidate_optin",
        entityId: courseId,
        division: "learn",
        reason: "Learner opted out of employer visibility for a course.",
        newValues: { course_id: courseId, user_id: user.id },
      });
      return NextResponse.json({ ok: true, listed: false });
    }

    const { error } = await admin
      .from("learn_candidate_optins")
      .upsert(
        {
          user_id: user.id,
          normalized_email: normalizedEmail,
          course_id: courseId,
          course_slug: courseSlug,
          visibility,
          opted_in_at: nowIso,
          revoked_at: null,
          updated_at: nowIso,
        } as never,
        { onConflict: "user_id,course_id" },
      );
    if (error) {
      return NextResponse.json(
        { error: "save_failed", message: "Couldn't update your visibility." },
        { status: 500 },
      );
    }

    const listed = visibility === "employers";
    await writeAuditLog(admin as unknown as AuditLogSupabaseClient, {
      action: "learn.candidate.opt_in",
      entityType: "learn_candidate_optin",
      entityId: courseId,
      division: "learn",
      reason: "Learner opted in to employer visibility for a course.",
      newValues: { course_id: courseId, visibility, user_id: user.id },
    });

    if (listed) {
      emitEvent({
        name: "henry.learn.candidate.listed",
        classification: "user_action",
        outcome: "completed",
        actorId: user.id,
        payload: { course_id: courseId, course_slug: courseSlug, division: "learn" },
      });
    }

    return NextResponse.json({ ok: true, listed });
  } catch (error) {
    console.error("[candidate-optin] POST error:", error);
    return NextResponse.json(
      { error: "internal_error", message: "Internal server error." },
      { status: 500 },
    );
  }
}
