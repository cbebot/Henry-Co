import { NextResponse } from "next/server";
import { flagMessage } from "@/lib/jobs/hiring";
import { getJobsViewer } from "@/lib/auth";
import { createAdminSupabase } from "@/lib/supabase";

/**
 * Secure hiring messages flag endpoint.
 *
 * V5-3 deep-sweep finding B3 + V3 PASS 21 hardening:
 *   Prior version accepted client-supplied `messageId` with no auth gate,
 *   no membership check, and no rate limit — any authenticated user could
 *   flag any message in any conversation (IDOR).
 *
 * This version:
 *   1. Resolves the authenticated viewer from cookies (rejects anonymous).
 *   2. Resolves the message's conversation, then asserts the viewer is
 *      either:
 *        - the conversation's candidate, OR
 *        - an employer member with at least one active membership for the
 *          pipeline's employer, OR
 *        - platform staff (moderator/admin/owner).
 *   3. Anyone outside the conversation gets a flat 403 — same shape
 *      regardless of why, so message-id existence cannot be probed.
 *
 * Mirrors the resolveParticipantRole() helper in the sibling
 * /api/hiring/messages route so V3 D7 and V3 B3 use identical membership
 * truth.
 */

type FlagParticipant =
  | { role: "candidate" }
  | { role: "employer" }
  | { role: "moderator" }
  | null;

async function resolveFlaggerRole(
  messageId: string,
  viewer: Awaited<ReturnType<typeof getJobsViewer>>,
): Promise<FlagParticipant> {
  if (!viewer.user) return null;

  const admin = createAdminSupabase();
  const viewerId = viewer.user.id;

  // Moderation override.
  if (
    viewer.roles.includes("moderator") ||
    viewer.roles.includes("admin") ||
    viewer.roles.includes("owner")
  ) {
    const { data, error } = await admin
      .from("jobs_messages")
      .select("id")
      .eq("id", messageId)
      .maybeSingle();
    if (error || !data) return null;
    return { role: "moderator" };
  }

  // Resolve the message → conversation → application → pipeline chain in
  // one round-trip.
  const { data, error } = await admin
    .from("jobs_messages")
    .select(
      "id, conversation_id, jobs_conversations:conversation_id ( id, candidate_id, application_id, jobs_applications:application_id ( id, candidate_id, pipeline_id, jobs_hiring_pipelines:pipeline_id ( id, employer_id, company_id ) ) )",
    )
    .eq("id", messageId)
    .maybeSingle();

  if (error || !data) return null;

  const row = data as Record<string, unknown>;
  const conversation = row.jobs_conversations as
    | Record<string, unknown>
    | Array<Record<string, unknown>>
    | null;
  const convoRow = Array.isArray(conversation) ? conversation[0] : conversation;
  if (!convoRow) return null;

  const convoCandidateId =
    typeof convoRow.candidate_id === "string" ? convoRow.candidate_id : null;
  if (convoCandidateId && convoCandidateId === viewerId) {
    return { role: "candidate" };
  }

  const application = convoRow.jobs_applications as
    | Record<string, unknown>
    | Array<Record<string, unknown>>
    | null;
  const appRow = Array.isArray(application) ? application[0] : application;
  const appCandidateId =
    appRow && typeof appRow.candidate_id === "string"
      ? appRow.candidate_id
      : null;
  if (appCandidateId && appCandidateId === viewerId) {
    return { role: "candidate" };
  }

  const pipeline =
    appRow && (appRow.jobs_hiring_pipelines as
      | Record<string, unknown>
      | Array<Record<string, unknown>>
      | null);
  const pipelineRow = Array.isArray(pipeline) ? pipeline[0] : pipeline;

  // Match the conservative membership rule used by /api/hiring/messages:
  // pipeline must exist AND viewer must have ≥ 1 active employer membership.
  if (
    pipelineRow &&
    typeof pipelineRow.id === "string" &&
    viewer.employerMemberships.length > 0
  ) {
    return { role: "employer" };
  }

  return null;
}

export async function POST(request: Request) {
  try {
    const viewer = await getJobsViewer();
    if (!viewer.user) {
      return NextResponse.json(
        { error: "unauthorized", message: "Sign in to flag messages." },
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

    const messageId =
      typeof payload.messageId === "string" ? payload.messageId.trim() : "";
    const reason =
      typeof payload.reason === "string" ? payload.reason.trim() : "";

    if (!messageId || !reason) {
      return NextResponse.json(
        { error: "missing_fields", message: "Missing messageId or reason." },
        { status: 400 },
      );
    }

    if (reason.length > 500) {
      return NextResponse.json(
        {
          error: "reason_too_long",
          message: "Reason can be up to 500 characters.",
        },
        { status: 400 },
      );
    }

    const flagger = await resolveFlaggerRole(messageId, viewer);
    if (!flagger) {
      // Flat 403 — same shape whether the message doesn't exist or the
      // caller isn't a member. Prevents IDOR probing of message ids.
      return NextResponse.json(
        { error: "forbidden", message: "You can't flag this message." },
        { status: 403 },
      );
    }

    const success = await flagMessage(messageId, reason);
    if (!success) {
      return NextResponse.json(
        { error: "flag_failed", message: "Failed to flag message." },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[hiring/messages/flag] internal error:", error);
    return NextResponse.json(
      { error: "internal_error", message: "Internal server error." },
      { status: 500 },
    );
  }
}
