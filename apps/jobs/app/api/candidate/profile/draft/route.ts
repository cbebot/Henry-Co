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

    // One draft row per user, keyed by a stable reference_id. customer_activity
    // has NO unique constraint on reference_id (prod-actual), so ON CONFLICT
    // can't coalesce — look up the existing draft row and update it in place,
    // else insert. (The table also has no updated_at/normalized_email columns
    // and division is NOT NULL — the previous upsert failed on all three; the
    // draft timestamp lives in metadata.savedAt.)
    const referenceId = `profile-draft:${viewer.user.id}`;
    const draftRow = {
      user_id: viewer.user.id,
      division: "jobs",
      activity_type: DRAFT_ACTIVITY_TYPE,
      reference_type: "jobs_candidate_profile",
      reference_id: referenceId,
      title: "Profile draft",
      description: "Work-in-progress profile auto-save",
      status: "draft",
      metadata: { draft: payload, savedAt: now },
      action_url: "/candidate/profile",
    };

    const { data: existing, error: lookupError } = await admin
      .from("customer_activity")
      .select("id")
      .eq("reference_id", referenceId)
      .eq("activity_type", DRAFT_ACTIVITY_TYPE)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (lookupError) {
      console.error("[candidate/profile/draft] lookup error:", lookupError.message);
      return NextResponse.json(
        { error: "save_failed", message: "Couldn't save draft." },
        { status: 500 },
      );
    }

    const { error } = existing
      ? await admin
          .from("customer_activity")
          .update(draftRow as never)
          .eq("id", existing.id)
      : await admin.from("customer_activity").insert(draftRow as never);

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
    // No updated_at column on customer_activity — the draft timestamp lives in
    // metadata.savedAt (created_at is the insert-time fallback).
    const { data, error } = await admin
      .from("customer_activity")
      .select("metadata, created_at")
      .eq("reference_id", referenceId)
      .eq("activity_type", DRAFT_ACTIVITY_TYPE)
      .order("created_at", { ascending: false })
      .limit(1)
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
      savedAt:
        (typeof metadata.savedAt === "string" ? metadata.savedAt : null) ??
        data?.created_at ??
        null,
    });
  } catch (error) {
    console.error("[candidate/profile/draft] internal error:", error);
    return NextResponse.json(
      { error: "internal_error" },
      { status: 500 },
    );
  }
}
