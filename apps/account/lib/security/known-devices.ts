import "server-only";

import { createAdminSupabase } from "@/lib/supabase";

/**
 * Recognised-device memory for sign-in alerting.
 *
 * `account_known_devices` records each browser/app a person has signed in from
 * (keyed by the signed device-cookie id). The state read here feeds the pure
 * `evaluateSignIn` decision; the country history (which suppresses repeat
 * new-location alerts) is drawn from each device's first country plus the
 * countries recorded on past security events.
 */

export type KnownDeviceState = {
  deviceIsKnown: boolean;
  knownActiveDeviceCount: number;
  earliestKnownDeviceAgeMs: number | null;
  priorCountries: string[];
};

type DeviceRow = {
  device_id: string;
  first_seen_at: string | null;
  first_country: string | null;
};

function normalizeCountry(value: unknown): string {
  return typeof value === "string" ? value.trim().toUpperCase() : "";
}

/**
 * Snapshot of the user's recognised devices + country history as it stands
 * BEFORE this sign-in is recorded. Best-effort: on any read failure it returns
 * a neutral "first sign-in" state, which the evaluator grandfathers (no alert).
 */
export async function loadKnownDeviceState(
  userId: string,
  deviceId: string,
  nowMs: number = Date.now(),
): Promise<KnownDeviceState> {
  try {
    const admin = createAdminSupabase();

    const { data: devices } = await admin
      .from("account_known_devices")
      .select("device_id, first_seen_at, first_country")
      .eq("user_id", userId)
      .is("revoked_at", null);

    const list: DeviceRow[] = Array.isArray(devices) ? (devices as DeviceRow[]) : [];
    const deviceIsKnown = list.some((d) => d.device_id === deviceId);

    let earliest: number | null = null;
    const priorCountries = new Set<string>();
    for (const d of list) {
      const seen = Date.parse(String(d.first_seen_at ?? ""));
      if (!Number.isNaN(seen)) earliest = earliest === null ? seen : Math.min(earliest, seen);
      const country = normalizeCountry(d.first_country);
      if (country) priorCountries.add(country);
    }

    // Countries recorded on prior security events (including past alerts) round
    // out the history so a place we've already flagged is not flagged again.
    const { data: logs } = await admin
      .from("customer_security_log")
      .select("metadata")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);
    for (const row of Array.isArray(logs) ? logs : []) {
      const meta = (row as { metadata?: unknown }).metadata;
      const country =
        meta && typeof meta === "object"
          ? normalizeCountry((meta as Record<string, unknown>).country)
          : "";
      if (country) priorCountries.add(country);
    }

    return {
      deviceIsKnown,
      knownActiveDeviceCount: list.length,
      earliestKnownDeviceAgeMs: earliest === null ? null : Math.max(0, nowMs - earliest),
      priorCountries: [...priorCountries],
    };
  } catch {
    return {
      deviceIsKnown: false,
      knownActiveDeviceCount: 0,
      earliestKnownDeviceAgeMs: null,
      priorCountries: [],
    };
  }
}

/**
 * Record this sign-in's device. Inserts on first sight (capturing the first
 * country), otherwise just refreshes `last_seen_at` + the device summary —
 * never overwriting the original first-seen baseline.
 */
export async function recordKnownDevice(
  userId: string,
  deviceId: string,
  uaSummary: string,
  country: string | null,
): Promise<void> {
  try {
    const admin = createAdminSupabase();
    const nowIso = new Date().toISOString();

    const { data: existing } = await admin
      .from("account_known_devices")
      .select("id")
      .eq("user_id", userId)
      .eq("device_id", deviceId)
      .maybeSingle();

    if (existing) {
      await admin
        .from("account_known_devices")
        .update({ last_seen_at: nowIso, ua_summary: uaSummary, revoked_at: null } as never)
        .eq("user_id", userId)
        .eq("device_id", deviceId);
      return;
    }

    await admin.from("account_known_devices").insert({
      user_id: userId,
      device_id: deviceId,
      ua_summary: uaSummary,
      first_country: country ? country.toUpperCase() : null,
      first_seen_at: nowIso,
      last_seen_at: nowIso,
    } as never);
  } catch {
    // Device memory is best-effort and must never block sign-in.
  }
}

/** Mark a device as explicitly trusted ("Yes, it was me"). */
export async function trustKnownDevice(userId: string, deviceId: string): Promise<boolean> {
  try {
    const admin = createAdminSupabase();
    const { error } = await admin
      .from("account_known_devices")
      .update({ trusted_at: new Date().toISOString(), revoked_at: null } as never)
      .eq("user_id", userId)
      .eq("device_id", deviceId);
    return !error;
  } catch {
    return false;
  }
}

export type KnownDeviceView = {
  deviceId: string;
  label: string;
  firstCountry: string | null;
  firstSeenAt: string | null;
  lastSeenAt: string | null;
  trusted: boolean;
};

/** The user's active recognised devices, most-recently-seen first. */
export async function listKnownDevices(userId: string): Promise<KnownDeviceView[]> {
  try {
    const admin = createAdminSupabase();
    const { data } = await admin
      .from("account_known_devices")
      .select("device_id, ua_summary, first_country, first_seen_at, last_seen_at, trusted_at")
      .eq("user_id", userId)
      .is("revoked_at", null)
      .order("last_seen_at", { ascending: false })
      .limit(50);
    return (Array.isArray(data) ? data : []).map((row) => {
      const r = row as Record<string, unknown>;
      return {
        deviceId: String(r.device_id ?? ""),
        label: typeof r.ua_summary === "string" && r.ua_summary ? r.ua_summary : "Unknown device",
        firstCountry: typeof r.first_country === "string" ? r.first_country : null,
        firstSeenAt: typeof r.first_seen_at === "string" ? r.first_seen_at : null,
        lastSeenAt: typeof r.last_seen_at === "string" ? r.last_seen_at : null,
        trusted: typeof r.trusted_at === "string" && r.trusted_at.length > 0,
      };
    });
  } catch {
    return [];
  }
}

/** Forget a device so it must be recognised (and re-alerted) afresh. */
export async function revokeKnownDevice(userId: string, deviceId: string): Promise<boolean> {
  try {
    const admin = createAdminSupabase();
    const { error } = await admin
      .from("account_known_devices")
      .update({ revoked_at: new Date().toISOString(), trusted_at: null } as never)
      .eq("user_id", userId)
      .eq("device_id", deviceId);
    return !error;
  } catch {
    return false;
  }
}

/**
 * Forget EVERY recognised device — used when the user secures a compromised
 * account, so each device must re-verify (and re-alert) on its next sign-in.
 */
export async function revokeAllKnownDevices(userId: string): Promise<void> {
  try {
    const admin = createAdminSupabase();
    await admin
      .from("account_known_devices")
      .update({ revoked_at: new Date().toISOString(), trusted_at: null } as never)
      .eq("user_id", userId)
      .is("revoked_at", null);
  } catch {
    // best-effort hygiene; never fatal to the secure flow.
  }
}

export type ReviewEvent = {
  eventId: string;
  deviceId: string | null;
  deviceLabel: string;
  locationSummary: string | null;
  whenIso: string | null;
  reason: string | null;
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Load a sign-in alert event for the "Was this you?" review surface, scoped to
 * the owner. Returns null for anything not found or not a valid id — the page
 * then simply renders without a review banner.
 */
export async function loadReviewEvent(
  userId: string,
  eventId: string,
): Promise<ReviewEvent | null> {
  if (!UUID_RE.test(eventId)) return null;
  try {
    const admin = createAdminSupabase();
    const { data } = await admin
      .from("customer_security_log")
      .select("id, created_at, metadata")
      .eq("user_id", userId)
      .eq("id", eventId)
      .maybeSingle();
    if (!data) return null;

    const row = data as { id: string; created_at: string | null; metadata: unknown };
    const meta =
      row.metadata && typeof row.metadata === "object"
        ? (row.metadata as Record<string, unknown>)
        : {};
    const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);

    return {
      eventId: row.id,
      deviceId: str(meta.device_id),
      deviceLabel: str(meta.device_summary) ?? "Unknown device",
      locationSummary: str(meta.location_summary),
      whenIso: row.created_at,
      reason: str(meta.reason),
    };
  } catch {
    return null;
  }
}

/** Resolve the device id tied to a specific alert event (owner-scoped). */
export async function deviceIdForEvent(userId: string, eventId: string): Promise<string | null> {
  const event = await loadReviewEvent(userId, eventId);
  return event?.deviceId ?? null;
}
