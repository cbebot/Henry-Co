/**
 * POST /api/learn/discussions
 *
 * Post a discussion comment (or reply) on a lesson. Realtime-published by
 * the V3 PASS 21 migration so the UI can subscribe to new replies.
 */

import { NextResponse } from "next/server";
import { contactSafety } from "@henryco/contact-safety";
import { createId, upsertLearnRecord } from "@/lib/learn/store";
import { getLearnViewer } from "@/lib/learn/auth";
import { getLearnSnapshot } from "@/lib/learn/data";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const viewer = await getLearnViewer();
  if (!viewer.user) {
    return NextResponse.json({ ok: false, error: "auth_required" }, { status: 401 });
  }

  let payload: {
    courseId?: string;
    lessonId?: string;
    parentId?: string;
    body?: string;
  };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const courseId = String(payload?.courseId || "").trim();
  const lessonId = String(payload?.lessonId || "").trim() || null;
  const parentId = String(payload?.parentId || "").trim() || null;
  const rawBody = String(payload?.body || "").trim();
  if (!courseId || !rawBody) {
    return NextResponse.json({ ok: false, error: "missing_fields" }, { status: 400 });
  }
  if (rawBody.length > 5000) {
    return NextResponse.json({ ok: false, error: "body_too_long" }, { status: 400 });
  }

  // Contact-safety screening (same classifier every division's comms use):
  // off-platform contact is blocked and never persisted; medium signals are
  // masked. Keeps course discussions on-platform without exposing the mechanics.
  const verdict = contactSafety(rawBody);
  if (verdict.action === "block") {
    return NextResponse.json(
      {
        ok: false,
        error: "contact_blocked",
        message: "To keep everyone safe, contact details can’t be shared in course discussions. Remove them and try again.",
      },
      { status: 422 },
    );
  }
  const body = verdict.action === "mask" ? verdict.maskedText : rawBody;

  const snapshot = await getLearnSnapshot();
  // Authorisation: must be enrolled in this course (or be staff / instructor).
  const isPrivileged = viewer.roles.some((role) =>
    ["academy_owner", "academy_admin", "instructor", "support"].includes(role),
  );
  const enrollment = snapshot.enrollments.find(
    (item) =>
      item.courseId === courseId &&
      ((viewer.user?.id && item.userId === viewer.user.id) ||
        (viewer.normalizedEmail && item.normalizedEmail === viewer.normalizedEmail)),
  );
  if (!enrollment && !isPrivileged) {
    return NextResponse.json({ ok: false, error: "not_enrolled" }, { status: 403 });
  }

  const id = createId();
  const isInstructorReply = viewer.roles.includes("instructor") ||
    viewer.roles.includes("academy_owner") ||
    viewer.roles.includes("academy_admin");

  await upsertLearnRecord(
    "learn_discussions",
    {
      id,
      course_id: courseId,
      lesson_id: lessonId,
      parent_id: parentId,
      user_id: viewer.user.id,
      normalized_email: viewer.normalizedEmail,
      author_display_name: viewer.user.fullName || viewer.user.email || "Henry Onyx learner",
      body,
      is_instructor_reply: isInstructorReply,
    },
    {
      userId: viewer.user.id,
      email: viewer.normalizedEmail,
      role: isInstructorReply ? "instructor" : "learner",
    },
  );

  return NextResponse.json({ ok: true, id });
}
