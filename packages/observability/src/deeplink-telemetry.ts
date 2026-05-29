import type { SupabaseClient } from "@supabase/supabase-js";

import { emitEvent } from "./events";
import { persistEvent } from "./persist-event";

/**
 * V3-04 (S8) — server-side deep-link telemetry recorders.
 *
 * Each recorder pairs the in-process `emitEvent` (structured log + Sentry
 * breadcrumb) with a persisted `henry_events` row, so the owner deep-link
 * health tile (S7) can rank dead links + arrival outcomes. Both halves are
 * best-effort: `persistEvent` swallows RLS / network failures so a telemetry
 * write NEVER breaks routing.
 *
 * The client-bundlable payload TYPES + ShareButton helpers live in
 * `@henryco/seo/deeplinks` (deliberately kept import-free of this package so
 * it stays client-bundlable). These recorders are the server emit+persist
 * half; callers pass a request- or admin-scoped Supabase client and, when
 * known, the acting user id (null for anonymous arrivals — the
 * `henry_events_insert_own` RLS policy allows a null actor for system events).
 *
 * NOTE: the canonical `henry_events` schema is { id, name, actor_id, payload
 * jsonb, created_at } — there is NO `outcome` column. The arrival/dead-link
 * outcome is stored inside `payload` (queryable as `payload->>'outcome'` /
 * `payload->>'target'`), which is what the S7 tile groups on.
 */

export type DeepLinkTelemetrySource =
  | "notification"
  | "email"
  | "share"
  | "sms"
  | "unknown";

/**
 * Map a `utm_source` query value (set by `@henryco/seo/deeplinks` `withUtm`)
 * to the telemetry source enum. Returns "unknown" for absent/foreign values —
 * callers use that to skip recording in-app navigations (which carry no UTM)
 * as deep-link arrivals.
 */
export function deepLinkSourceFromUtm(
  utmSource: string | null | undefined,
): DeepLinkTelemetrySource {
  switch ((utmSource ?? "").toLowerCase()) {
    case "henryco_notification":
      return "notification";
    case "henryco_email":
      return "email";
    case "henryco_share":
      return "share";
    case "henryco_sms":
      return "sms";
    default:
      return "unknown";
  }
}

export type RecordDeepLinkArrivedInput = {
  supabase: SupabaseClient;
  /** Acting user id when known; null for anonymous arrivals. */
  actorId?: string | null;
  source: DeepLinkTelemetrySource;
  /** Path (not full URL) the user landed on, e.g. "/modules/care". */
  target: string;
  /** "ok" = route resolved; "auth_gated" = bounced to sign-in; "not_found". */
  outcome: "ok" | "auth_gated" | "not_found";
};

/**
 * Record a deep-link arrival (a route reached via an attributed external
 * link). Callers should gate this on `source !== "unknown"` so ordinary
 * in-app navigations do not flood the event sink.
 */
export async function recordDeepLinkArrived(
  input: RecordDeepLinkArrivedInput,
): Promise<void> {
  const payload = {
    source: input.source,
    target: input.target,
    outcome: input.outcome,
  };
  emitEvent({
    name: "henry.deeplink.arrived",
    classification: "system_state",
    outcome:
      input.outcome === "ok"
        ? "completed"
        : input.outcome === "not_found"
          ? "failed"
          : "pending",
    actorId: input.actorId ?? undefined,
    payload,
  });
  await persistEvent({
    supabase: input.supabase,
    name: "henry.deeplink.arrived",
    actorId: input.actorId ?? null,
    payload,
  });
}

export type RecordDeepLinkDeadLinkInput = {
  supabase: SupabaseClient;
  /** Acting user id when known; null for anonymous arrivals. */
  actorId?: string | null;
  source: DeepLinkTelemetrySource;
  /** The 404'd path, e.g. "/modules/does-not-exist". */
  target: string;
  /** Source attribution token (notification id, email campaign, share token). */
  sourceRef?: string | null;
};

/**
 * Record a deep link that resolved to a 404. Worth recording regardless of
 * source attribution — a broken link is broken — so callers need not gate on
 * `source`.
 */
export async function recordDeepLinkDeadLink(
  input: RecordDeepLinkDeadLinkInput,
): Promise<void> {
  const payload = {
    source: input.source,
    target: input.target,
    sourceRef: input.sourceRef ?? null,
  };
  emitEvent({
    name: "henry.deeplink.dead_link",
    classification: "system_state",
    outcome: "failed",
    actorId: input.actorId ?? undefined,
    payload,
  });
  await persistEvent({
    supabase: input.supabase,
    name: "henry.deeplink.dead_link",
    actorId: input.actorId ?? null,
    payload,
  });
}
