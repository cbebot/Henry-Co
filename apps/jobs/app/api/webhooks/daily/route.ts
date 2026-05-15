import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import {
  findRoomByProviderName,
  getInterviewRoomConfig,
  recordInterviewRoomEvent,
  updateInterviewRoomStatus,
} from "@/lib/jobs/interview-room";

/**
 * V3 PASS 21 — Daily.co webhook receiver for jobs interview rooms.
 *
 * Daily.co delivers room lifecycle events as JSON POST with a signature
 * header. We validate the signature using DAILY_WEBHOOK_SECRET, persist
 * the raw event payload in jobs_interview_room_events, and translate
 * terminal events into status updates on jobs_interview_rooms.
 *
 * Event types we react to (Daily.co naming):
 *   - meeting.started        -> status=active
 *   - meeting.ended          -> status=completed (unless recording awaited)
 *   - recording.ready-to-download -> recording_url updated
 *   - participant.left       -> audit only
 *   - room.created           -> audit only
 *   - meeting.error          -> status=failed
 *
 * Signature: Daily signs the raw body with HMAC-SHA256 using
 * DAILY_WEBHOOK_SECRET, base64-encoded, delivered as `X-Webhook-Signature`.
 *
 * If the secret is unset the receiver returns 503 — we never want to
 * accept unsigned events in production.
 */
export const dynamic = "force-dynamic";

function safeJsonParse(input: string): Record<string, unknown> | null {
  try {
    const parsed = JSON.parse(input);
    return parsed && typeof parsed === "object"
      ? (parsed as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

function timingSafeStringEquals(a: string, b: string): boolean {
  const buf1 = Buffer.from(a, "utf8");
  const buf2 = Buffer.from(b, "utf8");
  if (buf1.length !== buf2.length) return false;
  return timingSafeEqual(buf1, buf2);
}

function extractRoomName(payload: Record<string, unknown>): string | null {
  // Daily.co webhooks place the room name at different paths depending on
  // event type. Check the common locations conservatively.
  const direct =
    typeof payload.room === "string"
      ? payload.room
      : payload.room && typeof payload.room === "object"
        ? (payload.room as Record<string, unknown>).name
        : null;
  if (typeof direct === "string" && direct) return direct;

  const fromData =
    payload.data && typeof payload.data === "object"
      ? (payload.data as Record<string, unknown>).room
      : null;
  if (typeof fromData === "string" && fromData) return fromData;
  if (fromData && typeof fromData === "object") {
    const nestedName = (fromData as Record<string, unknown>).name;
    if (typeof nestedName === "string") return nestedName;
  }

  const fromPayload =
    payload.payload && typeof payload.payload === "object"
      ? (payload.payload as Record<string, unknown>).room
      : null;
  if (typeof fromPayload === "string" && fromPayload) return fromPayload;
  if (fromPayload && typeof fromPayload === "object") {
    const nestedName = (fromPayload as Record<string, unknown>).name;
    if (typeof nestedName === "string") return nestedName;
  }

  return null;
}

function extractRecordingUrl(payload: Record<string, unknown>): string | null {
  const candidates: unknown[] = [
    payload.recording_url,
    payload.url,
    payload.data && (payload.data as Record<string, unknown>).recording_url,
    payload.payload && (payload.payload as Record<string, unknown>).recording_url,
    payload.payload && (payload.payload as Record<string, unknown>).download_link,
  ];
  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.startsWith("http")) {
      return candidate;
    }
  }
  return null;
}

export async function POST(request: Request) {
  const config = getInterviewRoomConfig();
  if (!config.webhookSecret) {
    return NextResponse.json(
      { error: "webhook_disabled", message: "Daily webhook secret not configured." },
      { status: 503 },
    );
  }

  const raw = await request.text();
  const signatureHeader =
    request.headers.get("x-webhook-signature") ||
    request.headers.get("X-Webhook-Signature") ||
    "";

  if (!signatureHeader) {
    return NextResponse.json(
      { error: "missing_signature" },
      { status: 401 },
    );
  }

  const expected = createHmac("sha256", config.webhookSecret)
    .update(raw)
    .digest("base64");

  if (!timingSafeStringEquals(signatureHeader, expected)) {
    return NextResponse.json(
      { error: "invalid_signature" },
      { status: 401 },
    );
  }

  const payload = safeJsonParse(raw);
  if (!payload) {
    return NextResponse.json(
      { error: "invalid_payload" },
      { status: 400 },
    );
  }

  const eventType =
    typeof payload.type === "string"
      ? payload.type
      : typeof payload.event === "string"
        ? payload.event
        : "unknown";

  const roomName = extractRoomName(payload);
  if (!roomName) {
    // Audit-only event (no room). Daily.co accept-and-200 contract — we
    // acknowledge so they don't retry forever.
    return NextResponse.json({ ok: true, ignored: true });
  }

  const room = await findRoomByProviderName(roomName);
  if (!room) {
    // Room is unknown to us — could be a Daily.co-side room created
    // outside HenryCo. Accept and drop.
    return NextResponse.json({ ok: true, unknown_room: true });
  }

  await recordInterviewRoomEvent(room.id, eventType, payload);

  // Translate terminal events into status updates.
  if (eventType === "meeting.started") {
    await updateInterviewRoomStatus(room.id, "active");
  } else if (eventType === "meeting.ended") {
    // Only mark completed if recording isn't expected or already in hand.
    if (!room.recordingEnabled || room.recordingUrl) {
      await updateInterviewRoomStatus(room.id, "completed");
    }
  } else if (
    eventType === "recording.ready-to-download" ||
    eventType === "recording.completed"
  ) {
    const url = extractRecordingUrl(payload);
    if (url) {
      await updateInterviewRoomStatus(room.id, "completed", {
        recordingUrl: url,
      });
    }
  } else if (eventType === "meeting.error") {
    await updateInterviewRoomStatus(room.id, "failed");
  }

  return NextResponse.json({ ok: true });
}
