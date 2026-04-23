import { NextResponse } from "next/server";
import { createStaffSupabaseServer } from "@/lib/supabase/server";
import { createStaffAdminSupabase } from "@/lib/supabase/admin";
import { getStaffViewer } from "@/lib/staff-auth";
import { viewerHasPermission } from "@/lib/roles";

function wantsJson(request: Request) {
  return (
    request.headers.get("x-henryco-async") === "1" ||
    request.headers.get("content-type")?.includes("application/json") ||
    request.headers.get("accept")?.includes("application/json")
  );
}

function respond(
  request: Request,
  input:
    | { ok: false; error: string; status: number; code: string }
    | { ok: true; payload: Record<string, unknown> }
) {
  if (wantsJson(request)) {
    if (!input.ok) {
      return NextResponse.json({ error: input.error, code: input.code }, { status: input.status });
    }
    return NextResponse.json(input.payload);
  }

  if (!input.ok) {
    return NextResponse.redirect(new URL(`/kyc?error=${input.code}`, request.url));
  }

  return NextResponse.redirect(new URL(`/kyc?reviewed=${input.payload.decision}`, request.url));
}

export async function POST(request: Request) {
  try {
    const supabase = await createStaffSupabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      if (wantsJson(request)) {
        return NextResponse.json({ error: "Authentication required." }, { status: 401 });
      }
      return NextResponse.redirect(new URL("/login", request.url));
    }

    const viewer = await getStaffViewer();
    if (!viewer || !viewerHasPermission(viewer, "division.moderate")) {
      return respond(request, {
        ok: false,
        error: "You do not have permission to review identity submissions.",
        status: 403,
        code: "forbidden",
      });
    }

    let submissionId = "";
    let decision = "";
    let note = "";

    if (request.headers.get("content-type")?.includes("application/json")) {
      const payload = (await request.json().catch(() => null)) as
        | { submissionId?: string; decision?: string; note?: string }
        | null;
      submissionId = String(payload?.submissionId || "").trim();
      decision = String(payload?.decision || "").trim();
      note = String(payload?.note || "").trim();
    } else {
      const formData = await request.formData();
      submissionId = String(formData.get("submission_id") || "").trim();
      decision = String(formData.get("decision") || "").trim();
      note = String(formData.get("note") || "").trim();
    }

    if (!submissionId || !["approved", "rejected"].includes(decision)) {
      return respond(request, {
        ok: false,
        error: "Choose a valid review decision.",
        status: 400,
        code: "invalid",
      });
    }

    if (decision === "rejected" && !note) {
      return respond(request, {
        ok: false,
        error: "Add a review note before requesting more information.",
        status: 400,
        code: "missing_note",
      });
    }

    const admin = createStaffAdminSupabase();
    const now = new Date().toISOString();

    // Update the submission.
    const { data: submission } = await admin
      .from("customer_verification_submissions")
      .select("id, user_id, document_type")
      .eq("id", submissionId)
      .maybeSingle();

    if (!submission) {
      return respond(request, {
        ok: false,
        error: "That verification submission could not be found.",
        status: 404,
        code: "not_found",
      });
    }

    const { error: auditError } = await admin.from("staff_audit_logs").insert({
      actor_id: user.id,
      actor_role: viewer.families[0] || viewer.user?.profileRole || "staff",
      action: `kyc.${decision}`,
      entity: "customer_verification_submission",
      entity_id: submissionId,
      meta: {
        target_user_id: String(submission.user_id),
        document_type: String(submission.document_type || ""),
        review_status: decision,
        reviewer_note_present: Boolean(note),
      },
    } as never);
    if (auditError) {
      console.error("[kyc/review] staff audit insert failed", auditError.message);
      return respond(request, {
        ok: false,
        error: "Audit logging failed; verification review was not changed.",
        status: 500,
        code: "audit_failed",
      });
    }

    await admin
      .from("customer_verification_submissions")
      .update({
        status: decision,
        reviewer_id: user.id,
        reviewer_note: note || null,
        reviewed_at: now,
      })
      .eq("id", submissionId);

    const userId = String(submission.user_id);
    let profileStatus = decision === "approved" ? "pending" : "rejected";

    if (decision === "approved") {
      // Check if government_id or selfie is now approved.
      const { data: allSubmissions } = await admin
        .from("customer_verification_submissions")
        .select("document_type, status")
        .eq("user_id", userId);

      const approved = new Set(
        (allSubmissions || [])
          .filter((r: Record<string, unknown>) => r.status === "approved")
          .map((r: Record<string, unknown>) => String(r.document_type))
      );

      if (approved.has("government_id") || approved.has("selfie")) {
        await admin
          .from("customer_profiles")
          .update({
            verification_status: "verified",
            verification_reviewed_at: now,
            verification_reviewer_id: user.id,
            verification_note: note || "Identity verified via document review.",
          })
          .eq("id", userId);
        profileStatus = "verified";
      } else {
        profileStatus = "pending";
      }
    }

    if (decision === "rejected") {
      const { data: pendingOthers } = await admin
        .from("customer_verification_submissions")
        .select("id")
        .eq("user_id", userId)
        .eq("status", "pending")
        .neq("id", submissionId)
        .limit(1);

      if (!pendingOthers || pendingOthers.length === 0) {
        await admin
          .from("customer_profiles")
          .update({
            verification_status: "rejected",
            verification_reviewed_at: now,
            verification_reviewer_id: user.id,
            verification_note: note || "Documents rejected.",
          })
          .eq("id", userId);
        profileStatus = "rejected";
      } else {
        profileStatus = "pending";
      }
    }

    const reviewerNote =
      decision === "approved"
        ? note || "Identity verification approved."
        : note || "More information is required before verification can be approved.";

    await admin.from("customer_activity").insert({
      user_id: userId,
      division: "account",
      activity_type: "verification_reviewed",
      title: decision === "approved" ? "Identity verification approved" : "Identity verification needs more information",
      description: reviewerNote,
      status: profileStatus,
      reference_type: "verification_submission",
      reference_id: submissionId,
      action_url: "/verification",
      metadata: {
        submission_id: submissionId,
        document_type: String(submission.document_type || ""),
        review_status: decision,
        reviewer_id: user.id,
      },
    } as never);

    await admin.from("customer_notifications").insert({
      user_id: userId,
      division: "account",
      title: decision === "approved" ? "Verification approved" : "Verification needs more information",
      body: reviewerNote,
      category: "verification",
      action_url: "/verification",
      reference_type: "verification_submission",
      reference_id: submissionId,
    } as never);

    return respond(request, {
      ok: true,
      payload: {
        ok: true,
        submissionId,
        decision,
        profileStatus,
        message:
          decision === "approved"
            ? "Verification review saved and the user has been notified."
            : "Review saved as needs more information and the user has been notified.",
      },
    });
  } catch (err) {
    console.error("[kyc/review] Error:", err);
    return respond(request, {
      ok: false,
      error: err instanceof Error ? err.message : "Internal review error.",
      status: 500,
      code: "internal",
    });
  }
}
