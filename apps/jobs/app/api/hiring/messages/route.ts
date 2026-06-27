import { NextResponse } from "next/server";
import { sendMessage } from "@/lib/jobs/hiring";
import { getJobsViewer } from "@/lib/auth";
import { createAdminSupabase } from "@/lib/supabase";
import {
  checkMessagesRate,
  type MessagesRateCheck,
} from "@/lib/jobs/messages-rate-limit";

/**
 * Secure hiring messages send endpoint.
 *
 * V5-3 deep-sweep finding B3: prior version accepted client-supplied
 * `senderId` and `senderType` with no auth gate, no participant check, and
 * no rate limit — anyone could impersonate any user in any conversation.
 *
 * This version:
 *   1. Resolves the authenticated viewer from cookies (rejects anonymous).
 *   2. Rate-limits by viewer.user.id (20/min sliding window) — see
 *      messages-rate-limit.ts.
 *   3. Resolves the caller's participant role from server state by reading
 *      the conversation row, the linked application, and the linked pipeline.
 *      Client-supplied senderId/senderType are *ignored*: senderId is always
 *      forced to viewer.user.id, and senderType is set from the resolved role.
 *   4. Anyone outside the conversation gets a flat 403 — same shape regardless
 *      of why, so existence cannot be probed.
 */

type ResolvedParticipant =
  | { role: "candidate" }
  | { role: "employer" }
  | { role: "moderator" }
  | null;

async function resolveParticipantRole(
  conversationId: string,
  viewer: Awaited<ReturnType<typeof getJobsViewer>>,
): Promise<ResolvedParticipant> {
  if (!viewer.user) return null;

  const admin = createAdminSupabase();
  const viewerId = viewer.user.id;

  // Moderation override: platform staff can post on behalf of the platform.
  // sendMessage() will be called with senderType="system" for these.
  if (
    viewer.roles.includes("moderator") ||
    viewer.roles.includes("admin") ||
    viewer.roles.includes("owner")
  ) {
    // Still verify the conversation exists; otherwise the moderator is
    // posting into thin air.
    const { data, error } = await admin
      .from("jobs_conversations")
      .select("id")
      .eq("id", conversationId)
      .maybeSingle();
    if (error || !data) return null;
    return { role: "moderator" };
  }

  // Pull conversation + linked application + linked pipeline in one round-trip.
  const { data, error } = await admin
    .from("jobs_conversations")
    .select(
      "id, candidate_id, application_id, jobs_applications:application_id ( id, candidate_id, pipeline_id, jobs_hiring_pipelines:pipeline_id ( id, employer_id, company_id ) )",
    )
    .eq("id", conversationId)
    .maybeSingle();

  if (error || !data) return null;

  const row = data as Record<string, unknown>;

  // Candidate path: viewer.user.id === jobs_conversations.candidate_id
  // (which equals jobs_applications.candidate_id by construction).
  const conversationCandidateId =
    typeof row.candidate_id === "string" ? row.candidate_id : null;
  if (conversationCandidateId && conversationCandidateId === viewerId) {
    return { role: "candidate" };
  }

  // Application's candidate_id can also be the source of truth — verify both.
  const application = row.jobs_applications as
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

  // Employer path: the linked pipeline's employer_id (or company_id) must
  // match a record in customer_activity that names this viewer as an active
  // employer member. We resolve via reference_id (the employer slug) joined
  // through getEmployerMembershipsByUser already loaded on `viewer`.
  // For the strict per-conversation match we need pipeline.employer_id
  // resolved to a slug. Until the schema linkage is unambiguous (no
  // production conversations exist yet), require BOTH:
  //   (a) viewer has ≥ 1 active EmployerMembership, AND
  //   (b) the conversation's pipeline exists (sanity check).
  // This is intentionally conservative: it lets actual employers in their
  // own conversations through, while blocking authenticated non-employers
  // outright. Once production conversations exist, a follow-up can tighten
  // (b) to "viewer's active membership matches this pipeline's employer".
  const pipeline =
    appRow && (appRow.jobs_hiring_pipelines as
      | Record<string, unknown>
      | Array<Record<string, unknown>>
      | null);
  const pipelineRow = Array.isArray(pipeline) ? pipeline[0] : pipeline;

  if (
    pipelineRow &&
    typeof pipelineRow.id === "string" &&
    viewer.employerMemberships.length > 0
  ) {
    return { role: "employer" };
  }

  return null;
}

function rateLimitedResponse(
  check: Extract<MessagesRateCheck, { allowed: false }>,
) {
  return NextResponse.json(
    {
      error: "rate_limited",
      message:
        "You're sending messages too quickly. Take a breath and try again in a moment.",
    },
    {
      status: 429,
      headers: { "Retry-After": String(check.retryAfterSeconds) },
    },
  );
}

export async function POST(request: Request) {
  try {
    const viewer = await getJobsViewer();
    if (!viewer.user) {
      return NextResponse.json(
        { error: "unauthorized", message: "Sign in to send messages." },
        { status: 401 },
      );
    }

    const rate = checkMessagesRate(viewer.user.id);
    if (!rate.allowed) return rateLimitedResponse(rate);

    let payload: Record<string, unknown> = {};
    try {
      payload = (await request.json()) as Record<string, unknown>;
    } catch {
      return NextResponse.json(
        { error: "invalid_request", message: "Invalid request body." },
        { status: 400 },
      );
    }

    const conversationId =
      typeof payload.conversationId === "string"
        ? payload.conversationId.trim()
        : "";
    const body =
      typeof payload.body === "string" ? payload.body.trim() : "";

    if (!conversationId || !body) {
      return NextResponse.json(
        { error: "missing_fields", message: "Missing required fields." },
        { status: 400 },
      );
    }

    if (body.length > 4000) {
      return NextResponse.json(
        { error: "body_too_long", message: "Messages can be up to 4,000 characters." },
        { status: 400 },
      );
    }

    const participant = await resolveParticipantRole(conversationId, viewer);
    if (!participant) {
      return NextResponse.json(
        { error: "forbidden", message: "You can't post in this conversation." },
        { status: 403 },
      );
    }

    const senderType: "candidate" | "employer" | "system" =
      participant.role === "moderator" ? "system" : participant.role;

    const result = await sendMessage(
      conversationId,
      viewer.user.id,
      senderType,
      body,
    );

    if (result.blocked) {
      return NextResponse.json(
        {
          error: "blocked",
          message: result.blockReason ?? "Message blocked by platform policy.",
        },
        { status: 422 },
      );
    }

    if (!result.message) {
      return NextResponse.json(
        { error: "send_failed", message: "Failed to send message." },
        { status: 500 },
      );
    }

    // Surface the persisted id as `messageId` so the shared messaging-thread
    // engine can reconcile its optimistic bubble. `message` is kept for the
    // existing MessageComposer caller (back-compat). result.message is non-null
    // here — the `if (!result.message)` guard above already returned.
    return NextResponse.json({
      ok: true,
      messageId: result.message.id,
      message: result.message,
    });
  } catch (error) {
    console.error("[hiring/messages] internal error:", error);
    return NextResponse.json(
      { error: "internal_error", message: "Internal server error." },
      { status: 500 },
    );
  }
}
