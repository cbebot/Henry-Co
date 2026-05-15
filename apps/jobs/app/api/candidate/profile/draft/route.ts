import { NextResponse } from "next/server";
import { getJobsViewer } from "@/lib/auth";
import { createAdminSupabase } from "@/lib/supabase";

/**
 * V3 PASS 21 — Candidate profile auto-save endpoint (J3).
 *
 * The <ProfileBuilder> client component pings this every 30s + on blur
 * with the in-flight draft fields. The draft is persisted to
 * candidate_activity (the existing customer_activity-style ledger) so
 * a reload restores work-in-progress before the candidate hits the
 * formal "Save profile" submit.
 *
 * We use a small dedicated table-ish row in candidate_activity rather
 * than the main jobs_candidate_profile row so we never corrupt the
 * published profile with mid-edit state.
 *
 * Body shape (all optional):
 *   {
 *     basics?: { fullName, headline, summary, location, ... },
 *     experience?: Array<...>,
 *     education?: Array<...>,
 *     skills?: string[],
 *     portfolio?: Array<{ label, url }>,
 *     references?: Array<{ ... }>,
 *   }
 *
 * Returns { ok: true, savedAt: ISO } on success.
 */
export const dynamic = "force-dynamic";

const DRAFT_ACTIVITY_TYPE = "jobs_profile_draft";

export async function POST(request: Request) {
  try {
    const viewer = await getJobsViewer();
    if (!viewer.user) {
      return NextResponse.json(
        { error: "unauthorized", message: "Sign in to save your profile." },
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

    // Guard size — 64 KB per draft. Anything larger means client misuse.
    const draftJson = JSON.stringify(payload);
    if (draftJson.length > 64 * 1024) {
      return NextResponse.json(
        {
          error: "payload_too_large",
          message: "Draft is too large to save.",
        },
        { status: 413 },
      );
    }

    const admin = createAdminSupabase();
    const now = new Date().toISOString();

    // Upsert into customer_activity using a stable reference_id so a
    // single draft row per user survives. We use the user_id as the
    // reference so concurrent edits coalesce.
    const referenceId = `profile-draft:${viewer.user.id}`;
    const { error } = await admin
      .from("customer_activity")
      .upsert(
        {
          user_id: viewer.user.id,
          normalized_email: viewer.normalizedEmail || null,
          activity_type: DRAFT_ACTIVITY_TYPE,
          reference_type: "jobs_candidate_profile",
          reference_id: referenceId,
          title: "Profile draft",
          description: "Work-in-progress profile auto-save",
          status: "draft",
          metadata: { draft: payload, savedAt: now },
          action_url: "/candidate/profile",
          updated_at: now,
        } as never,
        {
          onConflict: "reference_id",
        },
      );

    if (error) {
      console.error("[candidate/profile/draft] upsert error:", error.message);
      return NextResponse.json(
        { error: "save_failed", message: "Couldn't save draft." },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true, savedAt: now });
  } catch (error) {
    console.error("[candidate/profile/draft] internal error:", error);
    return NextResponse.json(
      { error: "internal_error", message: "Internal server error." },
      { status: 500 },
    );
  }
}

export async function GET() {
  try {
    const viewer = await getJobsViewer();
    if (!viewer.user) {
      return NextResponse.json(
        { error: "unauthorized" },
        { status: 401 },
      );
    }

    const admin = createAdminSupabase();
    const referenceId = `profile-draft:${viewer.user.id}`;
    const { data, error } = await admin
      .from("customer_activity")
      .select("metadata, updated_at")
      .eq("reference_id", referenceId)
      .eq("activity_type", DRAFT_ACTIVITY_TYPE)
      .maybeSingle();

    if (error) {
      console.error("[candidate/profile/draft] read error:", error.message);
      return NextResponse.json(
        { error: "lookup_failed" },
        { status: 500 },
      );
    }

    const metadata =
      data?.metadata && typeof data.metadata === "object"
        ? (data.metadata as Record<string, unknown>)
        : {};
    return NextResponse.json({
      draft:
        metadata.draft && typeof metadata.draft === "object"
          ? metadata.draft
          : null,
      savedAt: data?.updated_at ?? null,
    });
  } catch (error) {
    console.error("[candidate/profile/draft] internal error:", error);
    return NextResponse.json(
      { error: "internal_error" },
      { status: 500 },
    );
  }
}
