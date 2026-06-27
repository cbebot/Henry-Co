/**
 * LRN-1 — proof-of-watch verification (pure logic, no I/O).
 *
 * `completeLesson` previously trusted a client-supplied `secondsWatched`, so a
 * learner could forge a certificate without watching anything. This helper
 * decides whether a lesson's persisted playback heartbeat
 * (learn_lesson_playback, written by /api/learn/playback) proves the learner
 * actually watched enough of a video lesson.
 *
 * Imports ONLY types so it can be unit-tested in isolation
 * (`node --test lib/learn/watch-verification.test.mjs`).
 */

/** A learner must reach at least this fraction of a video before it completes. */
export const WATCH_PROOF_THRESHOLD = 0.85;

export type WatchVerificationPlayback = {
  positionSeconds?: number | null;
  durationSeconds?: number | null;
};

export type VerifyLessonWatchInput = {
  lessonType?: string | null;
  videoUrl?: string | null;
  durationMinutes?: number | null;
  playback?: WatchVerificationPlayback | null;
};

export type WatchVerificationResult = {
  ok: boolean;
  watchedSeconds: number;
};

function toSeconds(value: unknown) {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric > 0 ? Math.floor(numeric) : 0;
}

/** A lesson is gated when it is explicitly a video OR it carries a video URL. */
export function isVideoLesson(input: VerifyLessonWatchInput) {
  return input.lessonType === "video" || String(input.videoUrl ?? "").trim().length > 0;
}

export function verifyLessonWatch(input: VerifyLessonWatchInput): WatchVerificationResult {
  // Reading / resource / workshop lessons have no watch signal — always pass.
  if (!isVideoLesson(input)) {
    return { ok: true, watchedSeconds: 0 };
  }

  const watchedSeconds = toSeconds(input.playback?.positionSeconds);
  const playbackDuration = toSeconds(input.playback?.durationSeconds);
  const lessonDuration = toSeconds(Number(input.durationMinutes ?? 0) * 60);
  const expected = playbackDuration > 0 ? playbackDuration : lessonDuration;

  // Fail-safe: when we cannot establish an expected duration we cannot prove
  // non-completion, so we do not block (threshold * 0 === 0).
  const required = expected * WATCH_PROOF_THRESHOLD;
  return { ok: watchedSeconds >= required, watchedSeconds };
}
