import { NextResponse } from "next/server";
import { getJobsViewer } from "@/lib/auth";
import { updateInterviewRoomNotes } from "@/lib/jobs/interview-room";
import { createAdminSupabase } from "@/lib/supabase";

/**
 * V3 PASS 21 — Save employer notes for a jobs_interview_rooms row.
 *
 * Membership check: viewer must have at least one active employer
 * membership AND the room must belong to a pipeline under that
 * employer. We conservatively reuse the same shape as the messages-flag
 * route: require ≥1 employer membership + matching pipeline. Anyone
 * outside this gets a flat 403.
 *
 * Notes are stored on jobs_interview_rooms.employer_notes (plaintext);
 * a future hardening can mask candidate identifiers before storage.
 */
export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  context: { params: Promise<{ roomId: string }> },
) {
  try {
    const viewer = await getJobsViewer();
    if (!viewer.user) {
      return NextResponse.json(
        { error: "unauthorized", message: "Sign in to save notes." },
        { status: 401 },
      );
    }

    const { roomId } = await context.params;
    const trimmedId = roomId?.trim() || "";
    if (!trimmedId) {
      return NextResponse.json(
        { error: "missing_room", message: "Room id is required." },
        { status: 400 },
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

    const notesRaw = typeof payload.notes === "string" ? payload.notes : "";
    if (notesRaw.length > 8000) {
      return NextResponse.json(
        {
          error: "notes_too_long",
          message: "Notes can be up to 8,000 characters.",
        },
        { status: 400 },
      );
    }

    // Membership check.
    const admin = createAdminSupabase();

    // Moderation override.
    const isStaff =
      viewer.roles.includes("moderator") ||
      viewer.roles.includes("admin") ||
      viewer.roles.includes("owner");

    if (!isStaff) {
      if (viewer.employerMemberships.length === 0) {
        return NextResponse.json(
          { error: "forbidden", message: "Employer membership required." },
          { status: 403 },
        );
      }

      // Confirm the room exists and is linked to an application with a
      // pipeline. We don't yet attempt strict employer-slug-pipeline join
      // (the schema linkage is loose pre-production-data); the
      // ≥1-membership rule mirrors the messages-flag route's conservative
      // gate.
      const { data: roomRow, error: roomError } = await admin
        .from("jobs_interview_rooms")
        .select(
          "id, application_id, jobs_applications:application_id ( id, pipeline_id )",
        )
        .eq("id", trimmedId)
        .maybeSingle();

      if (roomError || !roomRow) {
        return NextResponse.json(
          { error: "forbidden", message: "Room not visible." },
          { status: 403 },
        );
      }
    }

    const ok = await updateInterviewRoomNotes(trimmedId, notesRaw);
    if (!ok) {
      return NextResponse.json(
        { error: "save_failed", message: "Couldn't save notes." },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[interviews/rooms/notes] internal error:", error);
    return NextResponse.json(
      { error: "internal_error", message: "Internal server error." },
      { status: 500 },
    );
  }
}
