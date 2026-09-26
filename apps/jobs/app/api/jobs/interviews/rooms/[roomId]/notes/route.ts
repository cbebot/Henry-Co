import { NextResponse } from "next/server";
import { updateInterviewRoomNotes } from "@/lib/jobs/interview-room";
import { resolveHiringActingContext } from "@/lib/jobs/hiring-guard";
import { getApplicationContext } from "@/lib/jobs/hiring-suite";
import { actingBusinessOwnsApplication } from "@/lib/jobs/hiring-authz";
import { createAdminSupabase } from "@/lib/supabase";

/**
 * V3 PASS 21 — Save employer notes for a jobs_interview_rooms row.
 *
 * Ownership (V3-CARE-JOBS-PREAPPLY-FIX-01), gated like the secure sibling
 * hiring routes: the caller must be signed in and acting as a BUSINESS
 * (session-resolved, membership re-verified live), and the room's
 * application must sit on a pipeline OWNED by that business. business_id
 * is the only trusted owner key; "has some employer membership" never
 * authorizes a specific room. There is no platform-staff bypass: these
 * are the employer's own notes. Anyone outside gets the same flat 403
 * whether or not the room exists, so room ids cannot be probed.
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
    const ctx = await resolveHiringActingContext();
    if (!ctx.userId) {
      return NextResponse.json(
        { error: "unauthorized", message: "Sign in to save notes." },
        { status: 401 },
      );
    }
    if (ctx.kind !== "business") {
      return NextResponse.json(
        { error: "forbidden", message: "This action requires a business account." },
        { status: 403 },
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

    // Ownership gate: room -> application -> pipeline -> owning business.
    const admin = createAdminSupabase();
    const { data: roomRow, error: roomError } = await admin
      .from("jobs_interview_rooms")
      .select("id, application_id")
      .eq("id", trimmedId)
      .maybeSingle();

    const room = roomRow as { id?: unknown; application_id?: unknown } | null;
    const roomApplicationId =
      room && typeof room.application_id === "string" ? room.application_id : "";
    const appCtx =
      !roomError && roomApplicationId
        ? await getApplicationContext(roomApplicationId)
        : null;

    if (!room || typeof room.id !== "string" || !actingBusinessOwnsApplication(ctx, appCtx)) {
      return NextResponse.json(
        { error: "forbidden", message: "Room not visible." },
        { status: 403 },
      );
    }

    const ok = await updateInterviewRoomNotes(room.id, notesRaw);
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
