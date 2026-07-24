/**
 * V3-38 — resolver unit suite. Proves the pass's structural guarantees:
 * most-specific-first matching, fail-safe unknown (never a false
 * "unavailable"), saved-address-beats-IP precedence, coarse IP (no city),
 * boundary opacity (no numeric provider counts leave), and the handler's
 * flag-dark + never-caller-supplied-location invariants.
 */
import assert from "node:assert/strict";
import { test } from "node:test";

import {
  resolveAvailabilityBatch,
  type ServiceAreaCoverageRow,
} from "../engine";
import { describeLocationArea, normalizeCountryCode, resolveViewerLocation } from "../location";
import {
  createAvailabilityRateLimiter,
  handleAvailabilityRequest,
  type AvailabilityTelemetryEvent,
} from "../handler";

function row(partial: Partial<ServiceAreaCoverageRow>): ServiceAreaCoverageRow {
  return {
    division: "care",
    offeringKey: "laundry",
    country: "NG",
    region: null,
    city: null,
    providerCount: 1,
    isActive: true,
    ...partial,
  };
}

const enuguCity = {
  country: "NG",
  region: "Enugu",
  city: "Enugu",
  source: "saved_address" as const,
};

// ---------------------------------------------------------------------------
// Engine: most-specific-first matching
// ---------------------------------------------------------------------------

test("city row wins over region and country rows (most-specific-first)", () => {
  const coverage = [
    row({ city: "Enugu", region: "Enugu" }),
    row({ region: "Enugu" }),
    row({}),
  ];
  const out = resolveAvailabilityBatch({
    division: "care",
    offeringKeys: ["laundry"],
    location: enuguCity,
    coverage,
  });
  assert.equal(out.results.laundry.status, "available");
  assert.equal(out.results.laundry.matchedScope, "city");
});

test("region row matches when no city row exists", () => {
  const coverage = [row({ region: "Enugu" })];
  const out = resolveAvailabilityBatch({
    division: "care",
    offeringKeys: ["laundry"],
    location: { ...enuguCity, city: "Nsukka" },
    coverage,
  });
  assert.equal(out.results.laundry.matchedScope, "region");
  assert.equal(out.results.laundry.status, "available");
});

test("country row is the final fallback", () => {
  const coverage = [row({})];
  const out = resolveAvailabilityBatch({
    division: "care",
    offeringKeys: ["laundry"],
    location: { country: "NG", region: "Lagos", city: "Ikeja", source: "saved_address" },
    coverage,
  });
  assert.equal(out.results.laundry.matchedScope, "country");
});

test("no matching row resolves unavailable (division has real coverage elsewhere)", () => {
  const coverage = [row({ city: "Enugu", region: "Enugu" })];
  const out = resolveAvailabilityBatch({
    division: "care",
    offeringKeys: ["laundry"],
    location: { country: "NG", region: "Lagos", city: "Ikeja", source: "saved_address" },
    coverage,
  });
  assert.equal(out.results.laundry.status, "unavailable");
  assert.equal(out.results.laundry.matchedScope, "none");
});

test("a city row from another region never matches the same city name", () => {
  const coverage = [row({ city: "Enugu", region: "Lagos" })];
  const out = resolveAvailabilityBatch({
    division: "care",
    offeringKeys: ["laundry"],
    location: enuguCity,
    coverage,
  });
  assert.equal(out.results.laundry.status, "unavailable");
});

// ---------------------------------------------------------------------------
// Engine: candidate admission — provider_count / is_active
// ---------------------------------------------------------------------------

test("provider_count = 0 rows never admit a match", () => {
  const coverage = [row({ providerCount: 0 }), row({ offeringKey: "repairs" })];
  const out = resolveAvailabilityBatch({
    division: "care",
    offeringKeys: ["laundry", "repairs"],
    location: enuguCity,
    coverage,
  });
  assert.equal(out.results.laundry.status, "unavailable");
  assert.equal(out.results.repairs.status, "available");
});

test("is_active = false rows never admit a match", () => {
  const coverage = [row({ isActive: false }), row({ offeringKey: "repairs" })];
  const out = resolveAvailabilityBatch({
    division: "care",
    offeringKeys: ["laundry"],
    location: enuguCity,
    coverage,
  });
  assert.equal(out.results.laundry.status, "unavailable");
});

test("rows from another division are invisible", () => {
  const coverage = [row({ division: "logistics" })];
  const out = resolveAvailabilityBatch({
    division: "care",
    offeringKeys: ["laundry"],
    location: enuguCity,
    coverage,
  });
  // The only active care rows count is zero ⇒ unseeded division ⇒ unknown.
  assert.equal(out.results.laundry.status, "unknown");
});

test("limited tier applies only when the option is set", () => {
  const coverage = [row({})];
  const plain = resolveAvailabilityBatch({
    division: "care",
    offeringKeys: ["laundry"],
    location: enuguCity,
    coverage,
  });
  assert.equal(plain.results.laundry.status, "available");
  const limited = resolveAvailabilityBatch({
    division: "care",
    offeringKeys: ["laundry"],
    location: enuguCity,
    coverage,
    limitedBelowProviderCount: 3,
  });
  assert.equal(limited.results.laundry.status, "limited");
});

// ---------------------------------------------------------------------------
// Engine: fail-safe unknown (the honesty rule)
// ---------------------------------------------------------------------------

test("coverage read failure (null) resolves unknown — never a false unavailable", () => {
  const out = resolveAvailabilityBatch({
    division: "care",
    offeringKeys: ["laundry"],
    location: enuguCity,
    coverage: null,
  });
  assert.equal(out.results.laundry.status, "unknown");
  assert.equal(out.summary.unknown, 1);
});

test("missing viewer location resolves unknown", () => {
  const out = resolveAvailabilityBatch({
    division: "care",
    offeringKeys: ["laundry"],
    location: null,
    coverage: [row({})],
  });
  assert.equal(out.results.laundry.status, "unknown");
});

test("an entirely unseeded division resolves unknown, not unavailable", () => {
  const out = resolveAvailabilityBatch({
    division: "care",
    offeringKeys: ["laundry"],
    location: enuguCity,
    coverage: [],
  });
  assert.equal(out.results.laundry.status, "unknown");
});

// ---------------------------------------------------------------------------
// Engine: normalization
// ---------------------------------------------------------------------------

test("area matching is case/whitespace-insensitive and strips a trailing 'State'", () => {
  const coverage = [row({ region: "Enugu" })];
  const out = resolveAvailabilityBatch({
    division: "care",
    offeringKeys: ["laundry"],
    location: { country: "NG", region: "  enugu STATE ", city: null, source: "saved_address" },
    coverage,
  });
  assert.equal(out.results.laundry.matchedScope, "region");
});

// ---------------------------------------------------------------------------
// Boundary opacity — the leak test
// ---------------------------------------------------------------------------

test("no numeric provider count survives the public boundary", () => {
  const coverage = [row({ providerCount: 7 }), row({ offeringKey: "repairs", providerCount: 12 })];
  const out = resolveAvailabilityBatch({
    division: "care",
    offeringKeys: ["laundry", "repairs"],
    location: enuguCity,
    coverage,
  });
  const walk = (value: unknown, path: string): void => {
    if (typeof value === "number") {
      // Summary counters are aggregate telemetry, allowed by contract.
      assert.ok(path.startsWith("summary."), `numeric leak at ${path}`);
      return;
    }
    if (value && typeof value === "object") {
      for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
        assert.notEqual(key, "providerCount", `providerCount leaked at ${path}${key}`);
        assert.notEqual(key, "provider_count", `provider_count leaked at ${path}${key}`);
        walk(child, `${path}${key}.`);
      }
    }
  };
  walk(out, "");
});

// ---------------------------------------------------------------------------
// Location precedence + coarseness
// ---------------------------------------------------------------------------

test("saved address always beats IP inference", () => {
  const location = resolveViewerLocation({
    savedAddress: { country: "Nigeria", state: "Enugu", city: "Enugu" },
    ipGeo: { country: "NG", region: "LA" },
  });
  assert.ok(location);
  assert.equal(location.source, "saved_address");
  assert.equal(location.country, "NG");
  assert.equal(location.city, "Enugu");
});

test("IP fallback is coarse: mapped NG region, never a city", () => {
  const location = resolveViewerLocation({
    savedAddress: null,
    ipGeo: { country: "ng", region: "en" },
  });
  assert.ok(location);
  assert.equal(location.source, "ip_approximate");
  assert.equal(location.country, "NG");
  assert.equal(location.region, "Enugu");
  assert.equal(location.city, null);
});

test("nothing resolvable returns null (engine then resolves unknown)", () => {
  assert.equal(resolveViewerLocation({ savedAddress: null, ipGeo: null }), null);
  assert.equal(
    resolveViewerLocation({ savedAddress: { country: "", state: null, city: null }, ipGeo: { country: "", region: null } }),
    null,
  );
});

test("country normalization accepts codes and supported names", () => {
  assert.equal(normalizeCountryCode("ng"), "NG");
  assert.equal(normalizeCountryCode("Nigeria"), "NG");
  assert.equal(normalizeCountryCode("Atlantis"), null);
});

test("area label discloses at the right grain (city only from a saved address)", () => {
  assert.equal(
    describeLocationArea({ country: "NG", region: "Enugu", city: "Enugu", source: "saved_address" }),
    "Enugu",
  );
  assert.equal(
    describeLocationArea({ country: "NG", region: "Lagos", city: null, source: "ip_approximate" }),
    "Lagos",
  );
  assert.equal(
    describeLocationArea({ country: "NG", region: null, city: null, source: "ip_approximate" }),
    "Nigeria",
  );
});

// ---------------------------------------------------------------------------
// Handler: flag-dark, validation, emit-only, no caller-supplied location
// ---------------------------------------------------------------------------

function handlerDeps(overrides?: Partial<Parameters<typeof handleAvailabilityRequest>[0]>) {
  const events: AvailabilityTelemetryEvent[] = [];
  const deps = {
    division: "care",
    enabled: true,
    loadCoverage: async () => [row({})],
    resolveLocation: async () => enuguCity,
    emit: (event: AvailabilityTelemetryEvent) => {
      events.push(event);
    },
    ...overrides,
  };
  return { deps, events };
}

test("handler is flag-dark: disabled ⇒ off, no reads, no emits", async () => {
  let read = false;
  const { deps, events } = handlerDeps({
    enabled: false,
    loadCoverage: async () => {
      read = true;
      return [];
    },
  });
  const out = await handleAvailabilityRequest(deps, { offeringKeys: ["laundry"] });
  assert.equal(out.status, 200);
  assert.equal(out.body.off, true);
  assert.equal(read, false);
  assert.equal(events.length, 0);
});

test("handler resolves a batch and emits aggregate counts only", async () => {
  const { deps, events } = handlerDeps();
  const out = await handleAvailabilityRequest(deps, { offeringKeys: ["laundry", "ghost"] });
  assert.equal(out.status, 200);
  const results = out.body.results as Record<string, { status: string }>;
  assert.equal(results.laundry.status, "available");
  assert.equal(results.ghost.status, "unavailable");
  assert.equal(out.body.areaLabel, "Enugu");
  assert.equal(events.length, 1);
  assert.equal(events[0].name, "henry.availability.batch.resolved");
  assert.equal(events[0].payload.count, 2);
  assert.equal(events[0].payload.available_count, 1);
});

test("handler ignores caller-supplied location fields (identity from the server only)", async () => {
  const { deps } = handlerDeps({
    resolveLocation: async () => null,
  });
  const out = await handleAvailabilityRequest(deps, {
    offeringKeys: ["laundry"],
    location: { country: "NG", region: "Enugu", city: "Enugu" },
    userId: "someone-else",
  });
  const results = out.body.results as Record<string, { status: string }>;
  // The body's location/userId had no effect: no server location ⇒ unknown.
  assert.equal(results.laundry.status, "unknown");
  assert.equal(out.body.areaLabel, null);
});

test("handler rejects malformed bodies", async () => {
  const { deps } = handlerDeps();
  assert.equal((await handleAvailabilityRequest(deps, null)).status, 400);
  assert.equal((await handleAvailabilityRequest(deps, { offeringKeys: [] })).status, 400);
  assert.equal(
    (await handleAvailabilityRequest(deps, { offeringKeys: ["bad key with spaces"] })).status,
    400,
  );
});

test("unavailable_shown beacon emits and records the coarse coverage gap", async () => {
  const gaps: Array<Record<string, unknown>> = [];
  const { deps, events } = handlerDeps({
    recordGap: async (gap) => {
      gaps.push(gap as unknown as Record<string, unknown>);
    },
  });
  const out = await handleAvailabilityRequest(deps, {
    telemetry: { kind: "unavailable_shown", offeringKey: "laundry" },
  });
  assert.equal(out.status, 202);
  assert.equal(events.length, 1);
  assert.equal(events[0].name, "henry.availability.unavailable.shown");
  assert.equal(gaps.length, 1);
  assert.equal(gaps[0].country, "NG");
  assert.equal(gaps[0].city, "Enugu");
});

test("ip-derived gaps never record a city; find_similar records no gap", async () => {
  const gaps: Array<Record<string, unknown>> = [];
  const { deps, events } = handlerDeps({
    resolveLocation: async () => ({ country: "NG", region: "Lagos", city: null, source: "ip_approximate" }),
    recordGap: async (gap) => {
      gaps.push(gap as unknown as Record<string, unknown>);
    },
  });
  await handleAvailabilityRequest(deps, {
    telemetry: { kind: "unavailable_shown", offeringKey: "laundry" },
  });
  assert.equal(gaps[0].city, null);
  await handleAvailabilityRequest(deps, {
    telemetry: { kind: "find_similar_clicked", offeringKey: "laundry" },
  });
  assert.equal(gaps.length, 1);
  assert.equal(events[1].name, "henry.availability.find_similar.clicked");
});

test("a throwing coverage reader degrades to unknown, never a 500", async () => {
  const { deps } = handlerDeps({
    loadCoverage: async () => {
      throw new Error("relation service_area_coverage does not exist");
    },
  });
  const out = await handleAvailabilityRequest(deps, { offeringKeys: ["laundry"] });
  assert.equal(out.status, 200);
  const results = out.body.results as Record<string, { status: string }>;
  assert.equal(results.laundry.status, "unknown");
});

test("rate limiter allows within the window and blocks beyond it", () => {
  const limiter = createAvailabilityRateLimiter({ limit: 2, windowMs: 60_000 });
  assert.equal(limiter.check("ip-1").allowed, true);
  assert.equal(limiter.check("ip-1").allowed, true);
  const blocked = limiter.check("ip-1");
  assert.equal(blocked.allowed, false);
  assert.ok(blocked.retryAfterSeconds >= 1);
  assert.equal(limiter.check("ip-2").allowed, true);
});
