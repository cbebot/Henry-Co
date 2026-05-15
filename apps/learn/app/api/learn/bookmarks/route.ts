/**
 * POST /api/learn/bookmarks
 *
 * Create a per-lesson bookmark (video timestamp + label).
 * RLS-enforced — learner can only insert against their own enrollment.
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
    timestampSeconds?: number;
    label?: string;
  };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const courseId = String(payload?.courseId || "").trim();
  const lessonId = String(payload?.lessonId || "").trim();
  const label = String(payload?.label || "").trim();
  const timestampSeconds = Math.max(0, Math.floor(Number(payload?.timestampSeconds || 0)));

  if (!courseId || !lessonId || !label) {
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

  const bookmarkId = createId();
  await upsertLearnRecord(
    "learn_lesson_bookmarks",
    {
      id: bookmarkId,
      enrollment_id: enrollment.id,
      user_id: viewer.user.id,
      normalized_email: viewer.normalizedEmail,
      lesson_id: lessonId,
      course_id: courseId,
      timestamp_seconds: timestampSeconds,
      label,
    },
    {
      userId: viewer.user.id,
      email: viewer.normalizedEmail,
      role: "learner",
    },
  );

  return NextResponse.json({ ok: true, id: bookmarkId });
}
