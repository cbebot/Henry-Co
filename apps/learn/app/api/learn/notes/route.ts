/**
 * POST /api/learn/notes
 *
 * Create or update a learner's private note for a lesson.
 */

import { NextResponse } from "next/server";
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
    body?: string;
    id?: string;
  };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const courseId = String(payload?.courseId || "").trim();
  const lessonId = String(payload?.lessonId || "").trim();
  const body = String(payload?.body || "").trim();
  if (!courseId || !lessonId || !body) {
    return NextResponse.json({ ok: false, error: "missing_fields" }, { status: 400 });
  }

  const snapshot = await getLearnSnapshot();
  const enrollment = snapshot.enrollments.find(
    (item) =>
      item.courseId === courseId &&
      ((viewer.user?.id && item.userId === viewer.user.id) ||
        (viewer.normalizedEmail && item.normalizedEmail === viewer.normalizedEmail)),
  );
  if (!enrollment) {
    return NextResponse.json({ ok: false, error: "not_enrolled" }, { status: 403 });
  }

  const id = payload?.id || createId();
  await upsertLearnRecord(
    "learn_lesson_notes",
    {
      id,
      enrollment_id: enrollment.id,
      user_id: viewer.user.id,
      normalized_email: viewer.normalizedEmail,
      lesson_id: lessonId,
      course_id: courseId,
      body,
    },
    {
      userId: viewer.user.id,
      email: viewer.normalizedEmail,
      role: "learner",
    },
  );

  return NextResponse.json({ ok: true, id });
}
