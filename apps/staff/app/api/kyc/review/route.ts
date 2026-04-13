import { NextResponse } from "next/server";
import { createStaffSupabaseServer } from "@/lib/supabase/server";
import { createStaffAdminSupabase } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const supabase = await createStaffSupabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    const formData = await request.formData();
    const submissionId = String(formData.get("submission_id") || "").trim();
    const decision = String(formData.get("decision") || "").trim();
    const note = String(formData.get("note") || "").trim();

    if (!submissionId || !["approved", "rejected"].includes(decision)) {
      return NextResponse.redirect(new URL("/kyc?error=invalid", request.url));
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
      return NextResponse.redirect(new URL("/kyc?error=not_found", request.url));
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
      }
    }

    return NextResponse.redirect(
      new URL(`/kyc?reviewed=${decision}`, request.url)
    );
  } catch (err) {
    console.error("[kyc/review] Error:", err);
    return NextResponse.redirect(new URL("/kyc?error=internal", request.url));
  }
}
