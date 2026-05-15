/**
 * POST /api/learn/playback
 *
 * Video player heartbeat. Called every ~5s by <VideoPlayer> to persist
 * the lesson playback position so the player resumes on reload.
 *
 * Writes upsert into learn_lesson_playback keyed by
 * (enrollment_id, lesson_id). Idempotent.
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
    positionSeconds?: number;
    durationSeconds?: number;
    playbackRate?: number;
    captionLocale?: string | null;
    event?: string | null;
  };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const courseId = String(payload?.courseId || "").trim();
  const lessonId = String(payload?.lessonId || "").trim();
  if (!courseId || !lessonId) {
    return NextResponse.json({ ok: false, error: "missing_ids" }, { status: 400 });
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

  const positionSeconds = Math.max(0, Math.floor(Number(payload?.positionSeconds || 0)));
  const durationSeconds = Math.max(0, Math.floor(Number(payload?.durationSeconds || 0)));
  const playbackRate = Math.min(4, Math.max(0.25, Number(payload?.playbackRate || 1)));

  await upsertLearnRecord(
    "learn_lesson_playback",
    {
      id: createId(),
      enrollment_id: enrollment.id,
      user_id: viewer.user.id,
      normalized_email: viewer.normalizedEmail,
      lesson_id: lessonId,
      course_id: courseId,
      position_seconds: positionSeconds,
      duration_seconds: durationSeconds,
      playback_rate: playbackRate,
      caption_locale: payload?.captionLocale ?? null,
      last_event: payload?.event ?? null,
    },
    {
      userId: viewer.user.id,
      email: viewer.normalizedEmail,
      role: "learner",
    },
  );

  return NextResponse.json({ ok: true });
}
