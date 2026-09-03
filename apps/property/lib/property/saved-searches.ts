import "server-only";

import { randomUUID } from "crypto";
import { normalizeEmail } from "@/lib/env";
import { searchProperties } from "@/lib/property/data";
import { sendPropertyEvent } from "@/lib/property/notifications";
import {
  listPropertySavedSearchesForUser,
  readPropertyRuntimeSnapshot,
  removePropertySavedSearch,
  upsertPropertySavedSearch,
} from "@/lib/property/store";
import type {
  PropertyListing,
  PropertySavedSearch,
  PropertySavedSearchCadence,
  PropertySavedSearchCriteria,
} from "@/lib/property/types";

/**
 * V3 PASS 21 — saved-search store + alert cadence module.
 *
 * Three public surfaces drive saved searches:
 *
 *   1. UI write — `apps/property/app/(public)/account/saved` (or the
 *      future account.henrycogroup.com `?module=property` saved view)
 *      invokes `createSavedSearch` / `deleteSavedSearch` /
 *      `setSavedSearchCadence`.
 *
 *   2. Cron sweep — `runSavedSearchAlertSweep(now)` is called by
 *      `/api/cron/property-automation`. It evaluates every active
 *      saved search, computes `listingsSince(criteria, since)`, and
 *      sends an alert email + persists `last_alert_at` when matches
 *      land.
 *
 *   3. UI read — the saved-search dashboard reads via
 *      `listSavedSearchesForUser(userId)`.
 *
 * Cadence rules (P4 gate):
 *   instant — fire on first match, regardless of last_alert_at, but at
 *             most once per 30 min per saved search.
 *   daily   — fire if (now - lastAlertAt) ≥ 22h.
 *   weekly  — fire if (now - lastAlertAt) ≥ 6d 12h.
 *   off     — never fire.
 *
 * The "at most one alert per saved search per cadence" floor is
 * enforced by writing `last_alert_at` immediately after enqueueing the
 * notification; the cron is idempotent on its own re-run windows.
 */

const CADENCE_INTERVAL_MS: Record<PropertySavedSearchCadence, number> = {
  instant: 30 * 60 * 1000,
  daily: 22 * 60 * 60 * 1000,
  weekly: (6 * 24 + 12) * 60 * 60 * 1000,
  off: Number.POSITIVE_INFINITY,
};

const DEFAULT_LOOKBACK_HOURS: Record<PropertySavedSearchCadence, number> = {
  instant: 1,
  daily: 24,
  weekly: 7 * 24,
  off: 0,
};

export function normalizeCriteria(input: Partial<PropertySavedSearchCriteria>): PropertySavedSearchCriteria {
  const criteria: PropertySavedSearchCriteria = {
    q: (typeof input.q === "string" && input.q.trim()) || null,
    kind: (typeof input.kind === "string" && input.kind.trim()) || null,
    area: (typeof input.area === "string" && input.area.trim()) || null,
    managed: input.managed === "1" ? "1" : null,
    furnished: input.furnished === "1" ? "1" : null,
    minBeds: Number.isFinite(input.minBeds as number) ? Number(input.minBeds) : null,
    maxBeds: Number.isFinite(input.maxBeds as number) ? Number(input.maxBeds) : null,
    minPrice: Number.isFinite(input.minPrice as number) ? Number(input.minPrice) : null,
    maxPrice: Number.isFinite(input.maxPrice as number) ? Number(input.maxPrice) : null,
    verifiedOnly: Boolean(input.verifiedOnly) || null,
  };
  return criteria;
}

export async function createSavedSearch(input: {
  userId: string;
  email: string | null;
  name?: string;
  criteria: Partial<PropertySavedSearchCriteria>;
  alertCadence?: PropertySavedSearchCadence;
}): Promise<PropertySavedSearch> {
  const id = randomUUID();
  const now = new Date().toISOString();
  const criteria = normalizeCriteria(input.criteria);
  const name = String(input.name || "").trim() || labelForCriteria(criteria);

  const saved: PropertySavedSearch = {
    id,
    userId: input.userId,
    normalizedEmail: normalizeEmail(input.email),
    name,
    criteria,
    alertCadence: input.alertCadence ?? "daily",
    lastAlertAt: null,
    lastAlertCount: 0,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  };

  await upsertPropertySavedSearch(saved);
  return saved;
}

export async function deleteSavedSearch(id: string) {
  await removePropertySavedSearch(id);
}

export async function setSavedSearchCadence(
  id: string,
  cadence: PropertySavedSearchCadence
) {
  const all = await readPropertyRuntimeSnapshot();
  const existing = all.savedSearches.find((row) => row.id === id);
  if (!existing) return null;
  const next: PropertySavedSearch = {
    ...existing,
    alertCadence: cadence,
    isActive: cadence !== "off",
    updatedAt: new Date().toISOString(),
  };
  await upsertPropertySavedSearch(next);
  return next;
}

export async function listSavedSearchesForUser(userId: string) {
  return listPropertySavedSearchesForUser(userId);
}

export function labelForCriteria(criteria: PropertySavedSearchCriteria): string {
  const parts: string[] = [];
  if (criteria.area) parts.push(criteria.area.replace(/-/g, " "));
  if (criteria.kind) parts.push(criteria.kind);
  if (criteria.minBeds) parts.push(`${criteria.minBeds}+ beds`);
  if (criteria.maxPrice) parts.push(`≤ ${criteria.maxPrice}`);
  if (criteria.managed === "1") parts.push("managed");
  if (criteria.furnished === "1") parts.push("furnished");
  if (criteria.verifiedOnly) parts.push("verified");
  return parts.length > 0 ? parts.join(" · ") : "Untitled search";
}

export function listingMatchesCriteria(
  listing: PropertyListing,
  criteria: PropertySavedSearchCriteria
): boolean {
  if (!["approved", "published"].includes(listing.status)) return false;
  if (criteria.kind && listing.kind !== criteria.kind) return false;
  if (criteria.area && listing.locationSlug !== criteria.area) return false;
  if (criteria.managed === "1" && !listing.managedByHenryCo) return false;
  if (criteria.furnished === "1" && !listing.furnished) return false;
  if (criteria.minBeds && (listing.bedrooms ?? 0) < (criteria.minBeds ?? 0)) return false;
  if (criteria.maxBeds && (listing.bedrooms ?? Number.POSITIVE_INFINITY) > (criteria.maxBeds ?? Number.POSITIVE_INFINITY)) {
    return false;
  }
  if (criteria.minPrice && listing.price < (criteria.minPrice ?? 0)) return false;
  if (criteria.maxPrice && listing.price > (criteria.maxPrice ?? Number.POSITIVE_INFINITY)) {
    return false;
  }
  if (criteria.verifiedOnly && !listing.trustBadges.some((badge) => /verif/i.test(badge))) {
    return false;
  }
  if (criteria.q) {
    const haystack = [
      listing.title,
      listing.summary,
      listing.description,
      listing.locationLabel,
      listing.district,
      ...listing.amenities,
    ]
      .join(" ")
      .toLowerCase();
    if (!haystack.includes(criteria.q.toLowerCase())) return false;
  }
  return true;
}

export type SavedSearchAlertOutcome =
  | { kind: "sent"; searchId: string; count: number }
  | { kind: "skipped"; searchId: string; reason: string };

export async function runSavedSearchAlertSweep(now = new Date()): Promise<{
  evaluated: number;
  sent: number;
  skipped: number;
  outcomes: SavedSearchAlertOutcome[];
}> {
  const snapshot = await readPropertyRuntimeSnapshot();
  const outcomes: SavedSearchAlertOutcome[] = [];
  let sent = 0;
  let skipped = 0;

  for (const search of snapshot.savedSearches) {
    if (!search.isActive || search.alertCadence === "off") {
      outcomes.push({ kind: "skipped", searchId: search.id, reason: "inactive" });
      skipped += 1;
      continue;
    }

    const lastAlertAt = search.lastAlertAt ? new Date(search.lastAlertAt).getTime() : 0;
    const elapsed = now.getTime() - lastAlertAt;
    const minInterval = CADENCE_INTERVAL_MS[search.alertCadence];
    if (elapsed < minInterval) {
      outcomes.push({ kind: "skipped", searchId: search.id, reason: "cadence-floor" });
      skipped += 1;
      continue;
    }

    const lookbackMs = (DEFAULT_LOOKBACK_HOURS[search.alertCadence] * 60 * 60 * 1000) || 0;
    const since = new Date(now.getTime() - lookbackMs).toISOString();

    const matches = snapshot.listings.filter((listing) => {
      if (!listingMatchesCriteria(listing, search.criteria)) return false;
      return listing.listedAt >= since || listing.updatedAt >= since;
    });

    if (matches.length === 0) {
      outcomes.push({ kind: "skipped", searchId: search.id, reason: "no-matches" });
      skipped += 1;
      continue;
    }

    const recipientEmail =
      search.normalizedEmail ||
      snapshot.listings.find((l) => l.id === matches[0]?.id)?.ownerEmail ||
      null;

    await sendPropertyEvent({
      event: "new_lead_alert",
      userId: search.userId,
      normalizedEmail: search.normalizedEmail,
      recipientEmail,
      entityType: "property_saved_search",
      entityId: search.id,
      payload: {
        listingTitle: matches[0]?.title || "New listings match your saved search",
        note: `${matches.length} listing${matches.length === 1 ? "" : "s"} matched "${search.name}" since ${since}.`,
        searchName: search.name,
        matchCount: matches.length,
        ctaHref: "/search",
      },
    });

    await upsertPropertySavedSearch({
      ...search,
      lastAlertAt: now.toISOString(),
      lastAlertCount: matches.length,
      updatedAt: now.toISOString(),
    });

    outcomes.push({ kind: "sent", searchId: search.id, count: matches.length });
    sent += 1;
  }

  return {
    evaluated: snapshot.savedSearches.length,
    sent,
    skipped,
    outcomes,
  };
}

/** Re-export searchProperties as the canonical "evaluate search" function
 * so callers don't import @/lib/property/data directly. */
export { searchProperties };
