import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { createAdminSupabase } from "@/lib/supabase";
import { logApiError, USER_FACING_SAVE, USER_FACING_LOAD } from "@/lib/user-facing-error";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// V2-NOT-01-C: dedicated preferences endpoint covering the new schema columns
// added in 20260501120000_notification_signal_foundation_extensions.sql
//   - email_fallback_enabled            boolean  (default true)
//   - email_fallback_delay_hours        integer  (1 | 4 | 12 | 24 | 48; default 24)
//   - quiet_hours_timezone              text     (IANA, nullable)
//   - muted_event_types                 text[]   (canonical mute list)
//   - muted_divisions                   text[]   (canonical mute list)
// Also covers the cluster of legacy in-app + per-channel + per-division
// columns the existing PreferencesForm at /settings already drives.
//
// Why a separate endpoint from /api/preferences/update:
//   - PATCH semantics: this endpoint only mutates fields that are present in
//     the body, never overwrites siblings to defaults. The legacy POST
//     endpoint is shaped around the existing form's "save all" model.
//   - Server-side validation is strict on every value, with a single
//     "validation_failed" error path that never reveals which field failed
//     (info-disclosure baseline).
//   - The shape of GET is a superset of the schema so the new
//     /settings/notifications page can render the entire surface with a
//     single fetch; PATCH is a single mutation path.

const ALLOWED_DELAY_HOURS: ReadonlySet<number> = new Set([1, 4, 12, 24, 48]);
const TIMEZONE_PATTERN = /^[A-Za-z0-9_+\-/]+$/; // mirrors the table check constraint
const MAX_TIMEZONE_LENGTH = 64;
const MAX_EVENT_TYPE_LENGTH = 64;
const MAX_MUTED_LIST = 200;

const VALID_DIVISIONS: ReadonlySet<string> = new Set([
  "hub",
  "account",
  "staff",
  "care",
  "marketplace",
  "property",
  "logistics",
  "jobs",
  "learn",
  "studio",
  "security",
  "system",
]);

// In-app + delivery booleans the page may toggle. Each must be a real boolean
// — strings like "true" are rejected so a malformed client can never write a
// truthy non-boolean and silently change behavior.
const BOOLEAN_FIELDS = [
  "in_app_toast_enabled",
  "notification_sound_enabled",
  "notification_vibration_enabled",
  "high_priority_only",
  "quiet_hours_enabled",
  "email_fallback_enabled",
  "email_marketing",
  "email_transactional",
  "email_digest",
  "push_enabled",
  "whatsapp_enabled",
  "sms_enabled",
] as const;

type BooleanField = (typeof BOOLEAN_FIELDS)[number];

function isBoolean(value: unknown): value is boolean {
  return typeof value === "boolean";
}

function normalizeTimeValue(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const m = value.trim().match(/^([01]\d|2[0-3]):([0-5]\d)(?::[0-5]\d)?$/);
  return m ? `${m[1]}:${m[2]}:00` : null;
}

function normalizeTimezone(value: unknown): string | null | { invalid: true } {
  if (value === null) return null;
  if (typeof value !== "string") return { invalid: true };
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.length > MAX_TIMEZONE_LENGTH) return { invalid: true };
  if (!TIMEZONE_PATTERN.test(trimmed)) return { invalid: true };
  // Browser-side check: Intl rejects unknown IANA zones with RangeError. This
  // is belt-and-braces — the table check constraint only enforces shape.
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: trimmed });
  } catch {
    return { invalid: true };
  }
  return trimmed;
}

function normalizeStringArray(
  value: unknown,
  options: { allowed?: ReadonlySet<string>; maxItemLength?: number },
): string[] | { invalid: true } {
  if (!Array.isArray(value)) return { invalid: true };
  if (value.length > MAX_MUTED_LIST) return { invalid: true };
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of value) {
    if (typeof raw !== "string") return { invalid: true };
    const item = raw.trim();
    if (!item) continue;
    if (options.maxItemLength && item.length > options.maxItemLength) {
      return { invalid: true };
    }
    if (options.allowed && !options.allowed.has(item)) {
      return { invalid: true };
    }
    if (seen.has(item)) continue;
    seen.add(item);
    out.push(item);
  }
  return out;
}

function userPreferenceDefaults(userId: string) {
  // The defaults the trigger applies; we return these on GET when no row
  // exists yet so the UI can render without a "no row" empty state. We do
  // NOT INSERT here — the trigger owns row creation per the V2-NOT-01-A
  // anti-pattern list.
  return {
    user_id: userId,
    email_fallback_enabled: true,
    email_fallback_delay_hours: 24,
    quiet_hours_enabled: false,
    quiet_hours_start: "22:00:00",
    quiet_hours_end: "07:00:00",
    quiet_hours_timezone: null,
    muted_divisions: [] as string[],
    muted_event_types: [] as string[],
    in_app_toast_enabled: true,
    notification_sound_enabled: false,
    notification_vibration_enabled: false,
    high_priority_only: false,
    email_marketing: true,
    email_transactional: true,
    email_digest: false,
    push_enabled: true,
    whatsapp_enabled: false,
    sms_enabled: false,
  };
}

function unauthorized() {
  return new NextResponse(null, { status: 401 });
}

function badRequest() {
  // Single shape, no field name leaked. Client owns the field-level UX
  // through optimistic rollback — server only confirms accept/reject.
  return NextResponse.json({ error: "validation_failed" }, { status: 400 });
}

function payloadTooLarge() {
  return new NextResponse(null, { status: 413 });
}

export async function GET() {
  try {
    const supabase = await createSupabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return unauthorized();

    const admin = createAdminSupabase();
    const { data, error } = await admin
      .from("customer_preferences")
      .select(
        [
          "user_id",
          "email_fallback_enabled",
          "email_fallback_delay_hours",
          "quiet_hours_enabled",
          "quiet_hours_start",
          "quiet_hours_end",
          "quiet_hours_timezone",
          "muted_divisions",
          "muted_event_types",
          "in_app_toast_enabled",
          "notification_sound_enabled",
          "notification_vibration_enabled",
          "high_priority_only",
          "email_marketing",
          "email_transactional",
          "email_digest",
          "push_enabled",
          "whatsapp_enabled",
          "sms_enabled",
        ].join(", "),
      )
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      logApiError("notifications/preferences GET", error);
      return NextResponse.json({ error: USER_FACING_LOAD }, { status: 500 });
    }

    const prefs = data ?? userPreferenceDefaults(user.id);
    return NextResponse.json({ preferences: prefs });
  } catch (err) {
    logApiError("notifications/preferences GET", err);
    return NextResponse.json({ error: USER_FACING_LOAD }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const lengthHeader = request.headers.get("content-length");
    if (lengthHeader && Number.parseInt(lengthHeader, 10) > 16_384) {
      return payloadTooLarge();
    }

    const supabase = await createSupabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return unauthorized();

    let body: Record<string, unknown>;
    try {
      const raw = await request.json();
      if (!raw || typeof raw !== "object" || Array.isArray(raw)) return badRequest();
      body = raw as Record<string, unknown>;
    } catch {
      return badRequest();
    }

    // Reject any user_id field; the row is keyed off the authenticated user.
    if ("user_id" in body) return badRequest();

    const updates: Record<string, unknown> = {};

    for (const field of BOOLEAN_FIELDS as readonly BooleanField[]) {
      if (!(field in body)) continue;
      if (!isBoolean(body[field])) return badRequest();
      updates[field] = body[field];
    }

    if ("email_fallback_delay_hours" in body) {
      const value = body.email_fallback_delay_hours;
      if (typeof value !== "number" || !Number.isInteger(value) || !ALLOWED_DELAY_HOURS.has(value)) {
        return badRequest();
      }
      updates.email_fallback_delay_hours = value;
    }

    if ("quiet_hours_start" in body) {
      const normalized = normalizeTimeValue(body.quiet_hours_start);
      if (!normalized) return badRequest();
      updates.quiet_hours_start = normalized;
    }
    if ("quiet_hours_end" in body) {
      const normalized = normalizeTimeValue(body.quiet_hours_end);
      if (!normalized) return badRequest();
      updates.quiet_hours_end = normalized;
    }

    if ("quiet_hours_timezone" in body) {
      const result = normalizeTimezone(body.quiet_hours_timezone);
      if (typeof result === "object" && result !== null && "invalid" in result) {
        return badRequest();
      }
      updates.quiet_hours_timezone = result;
    }

    if ("muted_divisions" in body) {
      const result = normalizeStringArray(body.muted_divisions, {
        allowed: VALID_DIVISIONS,
        maxItemLength: 32,
      });
      if (Array.isArray(result)) updates.muted_divisions = result;
      else return badRequest();
    }

    if ("muted_event_types" in body) {
      const result = normalizeStringArray(body.muted_event_types, {
        maxItemLength: MAX_EVENT_TYPE_LENGTH,
      });
      if (Array.isArray(result)) updates.muted_event_types = result;
      else return badRequest();
    }

    if (Object.keys(updates).length === 0) {
      // No-op PATCH is idempotently OK; report current state so the UI
      // doesn't have to roundtrip a separate GET to confirm.
      const admin = createAdminSupabase();
      const { data } = await admin
        .from("customer_preferences")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      return NextResponse.json({
        preferences: data ?? userPreferenceDefaults(user.id),
      });
    }

    updates.updated_at = new Date().toISOString();

    const admin = createAdminSupabase();

    // The trigger creates the row on first preference save; if the row is
    // missing here we still UPSERT so an authenticated user always sees their
    // change persist, even on the (impossible-in-practice) trigger-skipped
    // path. We guard against the user_id being overwritten by setting it
    // explicitly from the authenticated session.
    const { data: written, error } = await admin
      .from("customer_preferences")
      .upsert({ user_id: user.id, ...updates }, { onConflict: "user_id" })
      .select(
        [
          "user_id",
          "email_fallback_enabled",
          "email_fallback_delay_hours",
          "quiet_hours_enabled",
          "quiet_hours_start",
          "quiet_hours_end",
          "quiet_hours_timezone",
          "muted_divisions",
          "muted_event_types",
          "in_app_toast_enabled",
          "notification_sound_enabled",
          "notification_vibration_enabled",
          "high_priority_only",
          "email_marketing",
          "email_transactional",
          "email_digest",
          "push_enabled",
          "whatsapp_enabled",
          "sms_enabled",
        ].join(", "),
      )
      .single();

    if (error || !written) {
      logApiError("notifications/preferences PATCH", error);
      return NextResponse.json({ error: USER_FACING_SAVE }, { status: 500 });
    }

    return NextResponse.json({ preferences: written });
  } catch (err) {
    logApiError("notifications/preferences PATCH", err);
    return NextResponse.json({ error: USER_FACING_SAVE }, { status: 500 });
  }
}
