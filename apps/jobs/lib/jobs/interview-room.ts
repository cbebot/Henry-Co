import "server-only";

import { randomUUID } from "crypto";
import { createAdminSupabase } from "@/lib/supabase";

/**
 * V3 PASS 21 — Daily.co interview-room provider (Distinctive Rule #2).
 *
 * ENV (V3 PASS 21 preflight reality — all provisioned):
 *   DAILY_API_KEY          required to create rooms
 *   DAILY_DOMAIN           e.g. "henryco.daily.co" (canonical join host)
 *   DAILY_DOMAIN_NAME      Daily-side domain identifier (optional)
 *   DAILY_WEBHOOK_ID       Daily-side webhook configuration id
 *   DAILY_WEBHOOK_SECRET   shared secret used to validate incoming events
 *
 * When DAILY_API_KEY is missing, createInterviewRoom() degrades to a
 * draft-mode room (status=scheduled, join_url=null) so the rest of the
 * scheduling surface keeps working — the operator can paste a manual
 * meeting URL on the same row.
 *
 * Daily.co room creation reference:
 *   POST https://api.daily.co/v1/rooms
 *   body { name?, properties: { exp, eject_after_elapsed, enable_recording? } }
 *   returns { id, name, url, ... }
 */

export type InterviewRoomCreateInput = {
  applicationId: string;
  interviewId?: string | null;
  scheduledAt: string;
  durationMinutes: number;
  enableRecording?: boolean;
};

export type InterviewRoomRecord = {
  id: string;
  applicationId: string;
  interviewId: string | null;
  provider: "daily.co" | "jitsi" | "google-meet" | "zoom";
  providerRoomName: string | null;
  joinUrl: string | null;
  candidateToken: string | null;
  employerToken: string | null;
  scheduledAt: string;
  durationMinutes: number;
  status:
    | "scheduled"
    | "active"
    | "completed"
    | "cancelled"
    | "no_show"
    | "failed";
  recordingEnabled: boolean;
  recordingUrl: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
};

function getDailyConfig() {
  const apiKey = (process.env.DAILY_API_KEY || "").trim();
  const domain = (process.env.DAILY_DOMAIN || "").trim();
  const webhookSecret = (process.env.DAILY_WEBHOOK_SECRET || "").trim();
  return {
    apiKey,
    domain,
    webhookSecret,
    isConfigured: Boolean(apiKey && domain),
  };
}

function mapRoom(row: Record<string, unknown>): InterviewRoomRecord {
  return {
    id: String(row.id || ""),
    applicationId: String(row.application_id || ""),
    interviewId:
      row.interview_id && typeof row.interview_id === "string"
        ? row.interview_id
        : null,
    provider: (row.provider as InterviewRoomRecord["provider"]) || "daily.co",
    providerRoomName:
      typeof row.provider_room_name === "string"
        ? row.provider_room_name
        : null,
    joinUrl: typeof row.join_url === "string" ? row.join_url : null,
    candidateToken:
      typeof row.candidate_token === "string" ? row.candidate_token : null,
    employerToken:
      typeof row.employer_token === "string" ? row.employer_token : null,
    scheduledAt: String(row.scheduled_at || ""),
    durationMinutes: Number(row.duration_minutes) || 30,
    status:
      (row.status as InterviewRoomRecord["status"]) || "scheduled",
    recordingEnabled: row.recording_enabled === true,
    recordingUrl:
      typeof row.recording_url === "string" ? row.recording_url : null,
    metadata:
      row.metadata && typeof row.metadata === "object"
        ? (row.metadata as Record<string, unknown>)
        : {},
    createdAt: String(row.created_at || ""),
  };
}

/**
 * Create a Daily.co room (when env is configured) and persist a
 * jobs_interview_rooms row. Returns the persisted record. Returns null
 * if persistence fails — caller handles fallback UI.
 */
export async function createInterviewRoom(
  input: InterviewRoomCreateInput,
): Promise<InterviewRoomRecord | null> {
  const admin = createAdminSupabase();
  const config = getDailyConfig();

  const id = randomUUID();
  const expSeconds =
    Math.floor(new Date(input.scheduledAt).getTime() / 1000) +
    input.durationMinutes * 60 +
    15 * 60; // 15-min grace window after scheduled end

  let providerRoomName: string | null = null;
  let joinUrl: string | null = null;
  let candidateToken: string | null = null;
  let employerToken: string | null = null;
  const metadata: Record<string, unknown> = {};

  if (config.isConfigured) {
    const roomName = `henryco-${id.slice(0, 8)}-${Date.now().toString(36)}`;
    try {
      const response = await fetch("https://api.daily.co/v1/rooms", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: roomName,
          privacy: "private",
          properties: {
            exp: expSeconds,
            eject_after_elapsed: input.durationMinutes * 60 + 30 * 60,
            enable_recording: input.enableRecording ? "cloud" : undefined,
            enable_screenshare: true,
            enable_chat: true,
          },
        }),
      });

      if (response.ok) {
        const json = (await response.json()) as {
          name?: string;
          url?: string;
        };
        providerRoomName = json.name ?? roomName;
        joinUrl = json.url ?? `https://${config.domain}/${roomName}`;
        candidateToken = randomUUID();
        employerToken = randomUUID();
        metadata.dailyProvisioned = true;
      } else {
        const text = await response.text().catch(() => "");
        metadata.dailyProvisioned = false;
        metadata.dailyProvisionError = text.slice(0, 500);
        console.error(
          "[interview-room] Daily.co room create failed:",
          response.status,
          text.slice(0, 200),
        );
      }
    } catch (error) {
      metadata.dailyProvisioned = false;
      metadata.dailyProvisionError = String(error).slice(0, 500);
      console.error("[interview-room] Daily.co fetch error:", error);
    }
  } else {
    metadata.dailyProvisioned = false;
    metadata.dailyProvisionError = "env_missing";
  }

  const { data, error } = await admin
    .from("jobs_interview_rooms")
    .insert({
      id,
      application_id: input.applicationId,
      interview_id: input.interviewId || null,
      provider: "daily.co",
      provider_room_name: providerRoomName,
      join_url: joinUrl,
      candidate_token: candidateToken,
      employer_token: employerToken,
      scheduled_at: input.scheduledAt,
      duration_minutes: input.durationMinutes,
      recording_enabled: Boolean(input.enableRecording),
      status: "scheduled",
      metadata,
    })
    .select("*")
    .single();

  if (error) {
    console.error("[interview-room] insert error:", error.message);
    return null;
  }

  return data ? mapRoom(data as Record<string, unknown>) : null;
}

/**
 * Update room status (called from server actions when an employer
 * cancels, an interview completes, or webhook receives terminal events).
 */
export async function updateInterviewRoomStatus(
  roomId: string,
  status: InterviewRoomRecord["status"],
  patch?: { recordingUrl?: string; employerNotes?: string; candidateFeedback?: string },
): Promise<boolean> {
  const admin = createAdminSupabase();
  const update: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  };
  if (patch?.recordingUrl) update.recording_url = patch.recordingUrl;
  if (patch?.employerNotes !== undefined)
    update.employer_notes = patch.employerNotes;
  if (patch?.candidateFeedback !== undefined)
    update.candidate_feedback = patch.candidateFeedback;

  const { error } = await admin
    .from("jobs_interview_rooms")
    .update(update as never)
    .eq("id", roomId);

  if (error) {
    console.error("[interview-room] update status error:", error.message);
    return false;
  }
  return true;
}

/**
 * Update employer notes only — does NOT touch status. Used by the
 * employer-side <InterviewRoom> auto-save flow.
 */
export async function updateInterviewRoomNotes(
  roomId: string,
  notes: string,
): Promise<boolean> {
  const admin = createAdminSupabase();
  const { error } = await admin
    .from("jobs_interview_rooms")
    .update({
      employer_notes: notes,
      updated_at: new Date().toISOString(),
    } as never)
    .eq("id", roomId);

  if (error) {
    console.error("[interview-room] update notes error:", error.message);
    return false;
  }
  return true;
}

/**
 * Persist a single webhook event for a room (audit trail + status sync).
 */
export async function recordInterviewRoomEvent(
  roomId: string,
  eventType: string,
  payload: Record<string, unknown>,
): Promise<boolean> {
  const admin = createAdminSupabase();
  const { error } = await admin.from("jobs_interview_room_events").insert({
    id: randomUUID(),
    room_id: roomId,
    event_type: eventType,
    event_payload: payload,
  });

  if (error) {
    console.error("[interview-room] event insert error:", error.message);
    return false;
  }
  return true;
}

/**
 * Lookup a room by Daily.co room name (used by the webhook receiver to
 * resolve the persisted row before recording the event).
 */
export async function findRoomByProviderName(
  providerRoomName: string,
): Promise<InterviewRoomRecord | null> {
  const admin = createAdminSupabase();
  const { data, error } = await admin
    .from("jobs_interview_rooms")
    .select("*")
    .eq("provider_room_name", providerRoomName)
    .maybeSingle();

  if (error || !data) return null;
  return mapRoom(data as Record<string, unknown>);
}

export function getInterviewRoomConfig() {
  return getDailyConfig();
}
