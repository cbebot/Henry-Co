/**
 * POST /api/learn/discussions
 *
 * Post a discussion comment (or reply) on a lesson. Realtime-published by
 * the V3 PASS 21 migration so the UI can subscribe to new replies.
 */

import { NextResponse } from "next/server";
import { createId, upsertLearnRecord } from "@/lib/learn/store";
import { getLearnViewer } from "@/lib/learn/auth";
import { getLearnSnapshot } from "@/lib/learn/data";

export const runtime = "nodejs";

// Public course discussions are educational content — numbers, code, doc links,
// and @mentions are legitimate and common, so the aggressive 1:1-DM contact
// classifier is the wrong fit here (it false-blocks dates/error-codes/IPs and
// would strip reference links). We mask only the one unambiguous personal-contact
// vector — email addresses — so a scammer can't drop a "contact me off-platform"
// address, while everything else in the post is preserved.
const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

function maskEmails(text: string): string {
  return text.replace(EMAIL_RE, (match) => {
    const [local, domain] = match.split("@");
    return `${local.slice(0, 2)}***@${domain}`;
  });
}

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

  // Mask email addresses only — no hard block, so a legitimate technical post
  // (dates, error codes, IPs, code, reference links) is never rejected.
  const body = maskEmails(rawBody);

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
