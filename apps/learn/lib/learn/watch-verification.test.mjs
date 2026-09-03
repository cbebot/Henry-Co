/**
 * LRN-1 — proof-of-watch gate. Pure-logic tests for verifyLessonWatch.
 * Run: node --test lib/learn/watch-verification.test.mjs
 * (Node 24 strips the TS types when importing the .ts helper directly.)
 */
import { test } from "node:test";
import assert from "node:assert/strict";

import { verifyLessonWatch, WATCH_PROOF_THRESHOLD } from "./watch-verification.ts";

test("non-video lessons always pass (reading)", () => {
  const result = verifyLessonWatch({
    lessonType: "reading",
    videoUrl: null,
    durationMinutes: 30,
    playback: null,
  });
  assert.equal(result.ok, true);
});

test("video lesson passes when heartbeat watched >= 85% of playback duration", () => {
  const result = verifyLessonWatch({
    lessonType: "video",
    videoUrl: "https://cdn/video.m3u8",
    durationMinutes: 10,
    playback: { positionSeconds: 540, durationSeconds: 600 },
  });
  assert.equal(result.ok, true);
  assert.equal(result.watchedSeconds, 540);
});

test("video lesson fails when heartbeat watched < 85%", () => {
  const result = verifyLessonWatch({
    lessonType: "video",
    videoUrl: "https://cdn/video.m3u8",
    durationMinutes: 10,
    playback: { positionSeconds: 120, durationSeconds: 600 },
  });
  assert.equal(result.ok, false);
  assert.equal(result.watchedSeconds, 120);
});

test("video lesson detected by videoUrl even when lessonType is unset", () => {
  const result = verifyLessonWatch({
    lessonType: "",
    videoUrl: "https://cdn/video.m3u8",
    durationMinutes: 10,
    playback: { positionSeconds: 0, durationSeconds: 600 },
  });
  assert.equal(result.ok, false);
});

test("missing playback row for a video lesson fails the gate (no proof of watch)", () => {
  const result = verifyLessonWatch({
    lessonType: "video",
    videoUrl: "https://cdn/video.m3u8",
    durationMinutes: 10,
    playback: null,
  });
  assert.equal(result.ok, false);
  assert.equal(result.watchedSeconds, 0);
});

test("falls back to durationMinutes*60 when playback duration is unknown", () => {
  // expected = 10 * 60 = 600; threshold 85% = 510; watched 600 passes.
  const pass = verifyLessonWatch({
    lessonType: "video",
    videoUrl: null,
    durationMinutes: 10,
    playback: { positionSeconds: 600, durationSeconds: 0 },
  });
  assert.equal(pass.ok, true);
  // watched 300 < 510 fails.
  const fail = verifyLessonWatch({
    lessonType: "video",
    videoUrl: null,
    durationMinutes: 10,
    playback: { positionSeconds: 300, durationSeconds: 0 },
  });
  assert.equal(fail.ok, false);
});

test("fail-safe: unknown expected duration passes (cannot prove, do not block)", () => {
  const result = verifyLessonWatch({
    lessonType: "video",
    videoUrl: "https://cdn/video.m3u8",
    durationMinutes: 0,
    playback: { positionSeconds: 0, durationSeconds: 0 },
  });
  assert.equal(result.ok, true);
});

test("threshold constant is 0.85", () => {
  assert.equal(WATCH_PROOF_THRESHOLD, 0.85);
});
