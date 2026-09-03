/**
 * V3-38 — the shared `/api/availability` batch handler (framework-agnostic).
 *
 * Each division app's `app/api/availability/route.ts` is a thin wrapper: it
 * parses the request body, builds the injected deps (its own Supabase server
 * client for the viewer-scoped address read + the public coverage read, its
 * own geo headers, the governed flag, the observability emitter) and
 * serializes the `{ status, body }` this returns. The handler itself is pure
 * orchestration — no table access, no framework imports.
 *
 * Invariants held here:
 *   - FLAG-DARK: `enabled === false` short-circuits to `{ off: true }` before
 *     any read — with flags unset, nothing new activates.
 *   - VIEWER IDENTITY IS NEVER CALLER-SUPPLIED: the handler exposes no way to
 *     pass a location or user id in the body; `resolveLocation` is an injected
 *     server-side closure over the session.
 *   - EMIT-ONLY RESOLUTION: per-render results are telemetry events, never
 *     persisted. The ONLY persistence is the coverage-GAP counter (aggregate,
 *     location-keyed, no PII) via the optional `recordGap` — and only when an
 *     `UnavailableState` actually rendered (the `unavailable_shown` beacon).
 *   - OPAQUE BODY: responses carry status/scope codes + the viewer's own
 *     coarse area label — never provider counts, never coverage rows.
 */

import { z } from "zod";
import {
  resolveAvailabilityBatch,
  type AvailabilityLocation,
  type OfferingAvailability,
  type ServiceAreaCoverageRow,
} from "./engine";
import { describeLocationArea } from "./location";

export const AVAILABILITY_EVENT_NAMES = {
  batchResolved: "henry.availability.batch.resolved",
  unavailableShown: "henry.availability.unavailable.shown",
  findSimilarClicked: "henry.availability.find_similar.clicked",
} as const;

export type AvailabilityEventName =
  (typeof AVAILABILITY_EVENT_NAMES)[keyof typeof AVAILABILITY_EVENT_NAMES];

export interface AvailabilityTelemetryEvent {
  name: AvailabilityEventName;
  classification: "user_action" | "system_state";
  outcome: "completed";
  payload: Record<string, string | number | boolean | null>;
}

export interface AvailabilityCoverageGap {
  offeringKey: string;
  country: string;
  region: string | null;
  city: string | null;
}

export interface AvailabilityHandlerDeps {
  division: string;
  /** The governed `personalization_availability` flag, resolved by the route. */
  enabled: boolean;
  /** Best-effort coverage read — MUST return null on error, never throw. */
  loadCoverage: () => Promise<ServiceAreaCoverageRow[] | null>;
  /** Server-side viewer location (session address → IP headers). Never body-derived. */
  resolveLocation: () => Promise<AvailabilityLocation | null>;
  emit: (event: AvailabilityTelemetryEvent) => void;
  /** Optional aggregate coverage-gap persistence (service-role, best-effort). */
  recordGap?: (gap: AvailabilityCoverageGap) => Promise<void>;
}

const offeringKeySchema = z
  .string()
  .min(1)
  .max(64)
  .regex(/^[a-z0-9][a-z0-9_.:-]*$/i, "Expected an offering key slug");

const resolveBodySchema = z.object({
  offeringKeys: z.array(offeringKeySchema).min(1).max(40),
});

const telemetryBodySchema = z.object({
  telemetry: z.object({
    kind: z.enum(["unavailable_shown", "find_similar_clicked"]),
    offeringKey: offeringKeySchema,
  }),
});

export interface AvailabilityHandlerResult {
  status: number;
  body: Record<string, unknown>;
}

function publicResults(
  results: Record<string, OfferingAvailability>,
): Record<string, { status: string; matchedScope: string }> {
  const out: Record<string, { status: string; matchedScope: string }> = {};
  for (const [key, value] of Object.entries(results)) {
    // Projection at the boundary: status + scope codes only.
    out[key] = { status: value.status, matchedScope: value.matchedScope };
  }
  return out;
}

export async function handleAvailabilityRequest(
  deps: AvailabilityHandlerDeps,
  body: unknown,
): Promise<AvailabilityHandlerResult> {
  if (!deps.enabled) {
    // Flag-dark: no reads, no emits, nothing to see.
    return { status: 200, body: { off: true, results: {} } };
  }

  const telemetry = telemetryBodySchema.safeParse(body);
  if (telemetry.success) {
    return handleTelemetry(deps, telemetry.data.telemetry);
  }

  const resolve = resolveBodySchema.safeParse(body);
  if (!resolve.success) {
    return { status: 400, body: { off: false, error: "invalid_request" } };
  }

  const [location, coverage] = await Promise.all([
    safeResolveLocation(deps),
    safeLoadCoverage(deps),
  ]);

  const batch = resolveAvailabilityBatch({
    division: deps.division,
    offeringKeys: resolve.data.offeringKeys,
    location,
    coverage,
  });

  deps.emit({
    name: AVAILABILITY_EVENT_NAMES.batchResolved,
    classification: "system_state",
    outcome: "completed",
    payload: {
      division: deps.division,
      count: batch.summary.requested,
      available_count: batch.summary.available + batch.summary.limited,
      unavailable_count: batch.summary.unavailable,
      unknown_count: batch.summary.unknown,
      location_source: location?.source ?? null,
    },
  });

  return {
    status: 200,
    body: {
      off: false,
      results: publicResults(batch.results),
      // The viewer's OWN coarse area (their address or an approximate region)
      // for disclosed copy — coarse by construction, nobody else's data.
      areaLabel: describeLocationArea(location),
      locationSource: location?.source ?? null,
    },
  };
}

async function handleTelemetry(
  deps: AvailabilityHandlerDeps,
  telemetry: { kind: "unavailable_shown" | "find_similar_clicked"; offeringKey: string },
): Promise<AvailabilityHandlerResult> {
  const location = await safeResolveLocation(deps);
  const name =
    telemetry.kind === "unavailable_shown"
      ? AVAILABILITY_EVENT_NAMES.unavailableShown
      : AVAILABILITY_EVENT_NAMES.findSimilarClicked;

  deps.emit({
    name,
    classification: "user_action",
    outcome: "completed",
    payload: {
      division: deps.division,
      offering_key: telemetry.offeringKey,
      // Coarse, location-keyed, never user-keyed.
      country: location?.country ?? null,
      region: location?.region ?? null,
      location_source: location?.source ?? null,
    },
  });

  // ONLY the coverage-gap signal persists (aggregate counters; PRIVACY §3) —
  // and only when we know WHICH area lacked coverage.
  if (telemetry.kind === "unavailable_shown" && deps.recordGap && location) {
    try {
      await deps.recordGap({
        offeringKey: telemetry.offeringKey,
        country: location.country,
        region: location.region ?? null,
        // City only ever comes from the viewer's own saved address; recorded
        // here as the coverage-gap grain, not tied to any user.
        city: location.source === "saved_address" ? (location.city ?? null) : null,
      });
    } catch {
      // Best-effort: the gaps table may not be applied yet.
    }
  }

  return { status: 202, body: { ok: true } };
}

async function safeResolveLocation(
  deps: AvailabilityHandlerDeps,
): Promise<AvailabilityLocation | null> {
  try {
    return await deps.resolveLocation();
  } catch {
    return null;
  }
}

async function safeLoadCoverage(
  deps: AvailabilityHandlerDeps,
): Promise<ServiceAreaCoverageRow[] | null> {
  try {
    return await deps.loadCoverage();
  } catch {
    return null;
  }
}

/**
 * A small fixed-window rate limiter for the availability routes (the repo's
 * standard per-route in-memory pattern — see care contact). Keyed by caller
 * IP; prunes as it goes.
 */
export function createAvailabilityRateLimiter(options?: {
  limit?: number;
  windowMs?: number;
}): { check: (key: string) => { allowed: boolean; retryAfterSeconds: number } } {
  const limit = options?.limit ?? 30;
  const windowMs = options?.windowMs ?? 60_000;
  const windows = new Map<string, { start: number; count: number }>();

  return {
    check(key: string) {
      const now = Date.now();
      const bucket = windows.get(key);
      if (!bucket || now - bucket.start >= windowMs) {
        windows.set(key, { start: now, count: 1 });
        if (windows.size > 5_000) {
          for (const [k, v] of windows) {
            if (now - v.start >= windowMs) windows.delete(k);
          }
        }
        return { allowed: true, retryAfterSeconds: 0 };
      }
      bucket.count += 1;
      if (bucket.count > limit) {
        return {
          allowed: false,
          retryAfterSeconds: Math.max(1, Math.ceil((bucket.start + windowMs - now) / 1000)),
        };
      }
      return { allowed: true, retryAfterSeconds: 0 };
    },
  };
}
