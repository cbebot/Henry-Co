import "server-only";

import { createSupabaseMediaStore, type MediaStore } from "@henryco/media/server";

import { createAdminSupabase } from "@/lib/supabase";
import { normalizeEmail, normalizePhone, getOptionalEnv } from "@/lib/env";
import { slugify } from "@/lib/utils";
import { demoPropertySnapshot } from "@/lib/property/demo";
import { isPropertyDbListingsEnabled, listListingsFromDb, writeListingToDb } from "@/lib/property/db";
import {
  PROPERTY_DOCUMENT_RULE,
  PROPERTY_IMAGE_RULE,
  PROPERTY_PLACEHOLDER_IMAGE,
} from "@/lib/property/media";
import type {
  PropertyAgent,
  PropertyArea,
  PropertyDifferentiator,
  PropertyFaq,
  PropertyFeaturedCampaign,
  PropertyInquiry,
  PropertyListing,
  PropertyListingApplication,
  PropertyListingInspection,
  PropertyMaintenanceTicket,
  PropertyManagedRecord,
  PropertyNotificationRecord,
  PropertyPolicyEvent,
  PropertyRentPayment,
  PropertySavedListing,
  PropertySavedSearch,
  PropertyService,
  PropertySnapshot,
  PropertyViewingRequest,
} from "@/lib/property/types";

export const PROPERTY_RUNTIME_BUCKET = "property-runtime";
export const PROPERTY_MEDIA_BUCKET = "property-media";
export const PROPERTY_DOCUMENT_BUCKET = "property-documents";

let bucketsEnsured = false;
let propertySnapshotCache:
  | {
      expiresAt: number;
      value: PropertySnapshot;
    }
  | null = null;
let propertySnapshotPromise: Promise<PropertySnapshot> | null = null;

function cleanText(value?: unknown) {
  return String(value ?? "").trim();
}

function createId() {
  return crypto.randomUUID();
}

function dedupeById<T extends { id: string }>(items: T[]) {
  return [...new Map(items.map((item) => [item.id, item])).values()];
}

function buildRuntimeMetrics(input: Omit<PropertySnapshot, "metrics">): PropertySnapshot["metrics"] {
  const approvedListings = input.listings.filter((listing) =>
    ["published", "approved"].includes(listing.status)
  ).length;
  const managedPortfolio = input.managedRecords.filter((record) => record.status === "active").length;
  const viewingPipeline = input.viewingRequests.filter((request) =>
    ["requested", "scheduled", "confirmed"].includes(request.status)
  ).length;

  return [
    {
      label: "Live listings",
      value: String(approvedListings),
      hint: "Public inventory currently available on Henry Onyx Property.",
    },
    {
      label: "Managed portfolio",
      value: String(managedPortfolio),
      hint: "Active managed-property records tracked in Henry Onyx operations.",
    },
    {
      label: "Viewing pipeline",
      value: String(viewingPipeline),
      hint: "Open viewing requests currently being scheduled or confirmed.",
    },
  ];
}

function invalidatePropertySnapshotCache() {
  propertySnapshotCache = null;
  propertySnapshotPromise = null;
}

async function ensureBucket(
  name: string,
  options: { public: boolean; fileSizeLimit?: string }
) {
  const admin = createAdminSupabase();
  const { data: buckets } = await admin.storage.listBuckets();
  const exists = (buckets ?? []).some((bucket) => bucket.name === name);

  if (!exists) {
    await admin.storage.createBucket(name, options);
  }
}

export async function ensurePropertyBuckets() {
  if (bucketsEnsured) return;

  try {
    await ensureBucket(PROPERTY_RUNTIME_BUCKET, { public: false, fileSizeLimit: "10MB" });
    await ensureBucket(PROPERTY_MEDIA_BUCKET, { public: true, fileSizeLimit: "50MB" });
    await ensureBucket(PROPERTY_DOCUMENT_BUCKET, { public: false, fileSizeLimit: "50MB" });
    bucketsEnsured = true;
  } catch {
    // Keep runtime resilient during local setup.
  }
}

async function listJsonCollection<T>(folder: string): Promise<T[]> {
  await ensurePropertyBuckets();

  try {
    const admin = createAdminSupabase();
    const { data: files, error } = await admin.storage.from(PROPERTY_RUNTIME_BUCKET).list(folder, {
      limit: 500,
      sortBy: { column: "name", order: "asc" },
    });

    if (error) throw error;

    const jsonFiles = (files ?? []).filter((file) => file.name.endsWith(".json"));
    const results = await Promise.all(
      jsonFiles.map(async (file) => {
        const { data } = await admin
          .storage
          .from(PROPERTY_RUNTIME_BUCKET)
          .download(`${folder}/${file.name}`);

        if (!data) return null;
        return JSON.parse(await data.text()) as T;
      })
    );

    return results.filter(Boolean) as T[];
  } catch {
    return [];
  }
}

async function writeJsonRecord<T>(folder: string, id: string, payload: T) {
  await ensurePropertyBuckets();

  const admin = createAdminSupabase();
  const file = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });

  await admin.storage
    .from(PROPERTY_RUNTIME_BUCKET)
    .upload(`${folder}/${id}.json`, file, {
      contentType: "application/json",
      upsert: true,
    });

  invalidatePropertySnapshotCache();
}

async function removeJsonRecord(folder: string, id: string) {
  await ensurePropertyBuckets();
  const admin = createAdminSupabase();
  await admin.storage.from(PROPERTY_RUNTIME_BUCKET).remove([`${folder}/${id}.json`]);
  invalidatePropertySnapshotCache();
}

/**
 * Listing media + documents flow through @henryco/media (Supabase-first, a
 * swappable seam). Each upload rides the property service-role client (the
 * correct factory path under the RLS/grant lockdown) and returns a
 * backend-neutral `media://` reference persisted in place of a raw URL:
 *  - PHOTOS  -> the PUBLIC `property-media` bucket (rendered on browse/detail)
 *  - DOCUMENTS -> the RLS-PRIVATE `property-documents` bucket (signed-URL only,
 *    never a public CDN)
 */
function getPropertyMediaStore(): MediaStore {
  // Fresh service-role client per call (repo convention: admin clients are not
  // module-cached), injected so the media layer never reads credentials itself.
  return createSupabaseMediaStore({ client: createAdminSupabase() });
}

export async function uploadPropertyMedia(listingId: string, file: File): Promise<string> {
  await ensurePropertyBuckets();
  return getPropertyMediaStore().upload({
    file,
    visibility: "public",
    bucket: PROPERTY_MEDIA_BUCKET,
    pathPrefix: `listings/${slugify(listingId) || "listing"}`,
    rule: PROPERTY_IMAGE_RULE,
  });
}

export async function uploadPropertyDocument(entityId: string, file: File): Promise<string> {
  await ensurePropertyBuckets();
  return getPropertyMediaStore().upload({
    file,
    visibility: "private",
    bucket: PROPERTY_DOCUMENT_BUCKET,
    pathPrefix: `documents/${slugify(entityId) || "document"}`,
    rule: PROPERTY_DOCUMENT_RULE,
  });
}

// ─── Curated-catalog auto-seed ───────────────────────────────────────────
/**
 * Populate the property runtime bucket with the curated company catalog
 * (areas, agents, listings, managed records, campaigns, services, FAQs,
 * differentiators) on first read. Without this the bucket is empty in
 * production and the public site shows no listings.
 *
 * Mirrors the marketplace/learn bootstrap: idempotent (writeJsonRecord
 * upserts by id), version-gated (a `meta/bootstrap.json` marker), service-
 * role-guarded (no-ops without the key so a misconfigured deploy still
 * renders empty rather than 500-ing), memoized single-flight. Content only —
 * no inquiries/viewings/applications are seeded. Additive/refresh-only: a
 * version bump re-writes the curated records but never auto-retires
 * agent-managed listings.
 */
export const PROPERTY_SEED_VERSION = "2026-06-10-henry-onyx-property-v1";
const PROPERTY_SEED_META_FOLDER = "meta";
const PROPERTY_SEED_MARKER_ID = "bootstrap";

let propertyBootstrapVerified = false;
let propertyBootstrapPromise: Promise<void> | null = null;

function hasPropertyServiceRole() {
  return Boolean(getOptionalEnv("SUPABASE_SERVICE_ROLE_KEY"));
}

async function readPropertySeedVersion(): Promise<string | null> {
  const records = await listJsonCollection<{ id?: string; version?: string }>(
    PROPERTY_SEED_META_FOLDER
  );
  const marker =
    records.find((record) => cleanText(record?.id) === PROPERTY_SEED_MARKER_ID) ?? records[0] ?? null;
  return marker ? cleanText(marker.version) || null : null;
}

/**
 * Ensure the curated catalog exists before the runtime snapshot is read.
 * Cheap and safe to call on every read: short-circuits once the current
 * version is confirmed, memoizes the in-flight seed, and swallows failures
 * (logged) so the property site never 500s on a seeding hiccup.
 */
export async function ensurePropertyBootstrap(): Promise<void> {
  if (propertyBootstrapVerified) return;
  if (!hasPropertyServiceRole()) return;

  const version = await readPropertySeedVersion();
  if (version === PROPERTY_SEED_VERSION) {
    propertyBootstrapVerified = true;
    return;
  }

  if (!propertyBootstrapPromise) {
    propertyBootstrapPromise = (async () => {
      try {
        await seedPropertyRuntimeSnapshot(demoPropertySnapshot);
        await writeJsonRecord(PROPERTY_SEED_META_FOLDER, PROPERTY_SEED_MARKER_ID, {
          id: PROPERTY_SEED_MARKER_ID,
          version: PROPERTY_SEED_VERSION,
          seededAt: new Date().toISOString(),
        });
        propertyBootstrapVerified = true;
      } catch (err) {
        console.error("[henryco/property] catalog bootstrap failed:", err);
      } finally {
        propertyBootstrapPromise = null;
      }
    })();
  }
  await propertyBootstrapPromise;
}

export async function readPropertyRuntimeSnapshot(): Promise<PropertySnapshot> {
  await ensurePropertyBootstrap();
  const now = Date.now();
  if (propertySnapshotCache && propertySnapshotCache.expiresAt > now) {
    return propertySnapshotCache.value;
  }

  if (propertySnapshotPromise) {
    return propertySnapshotPromise;
  }

  propertySnapshotPromise = (async () => {
  const [
    areas,
    agents,
    listings,
    inquiries,
    viewingRequests,
    applications,
    inspections,
    policyEvents,
    managedRecords,
    campaigns,
    notifications,
    savedListings,
    savedSearches,
    rentPayments,
    maintenanceTickets,
    services,
    faqs,
    differentiators,
  ] = await Promise.all([
    listJsonCollection<PropertyArea>("areas"),
    listJsonCollection<PropertyAgent>("agents"),
    listJsonCollection<PropertyListing>("listings"),
    listJsonCollection<PropertyInquiry>("inquiries"),
    listJsonCollection<PropertyViewingRequest>("viewings"),
    listJsonCollection<PropertyListingApplication>("applications"),
    listJsonCollection<PropertyListingInspection>("inspections"),
    listJsonCollection<PropertyPolicyEvent>("policy-events"),
    listJsonCollection<PropertyManagedRecord>("managed-records"),
    listJsonCollection<PropertyFeaturedCampaign>("campaigns"),
    listJsonCollection<PropertyNotificationRecord>("notifications"),
    listJsonCollection<PropertySavedListing>("saved-listings"),
    listJsonCollection<PropertySavedSearch>("saved-searches"),
    listJsonCollection<PropertyRentPayment>("rent-payments"),
    listJsonCollection<PropertyMaintenanceTicket>("maintenance-tickets"),
    listJsonCollection<PropertyService>("services"),
    listJsonCollection<PropertyFaq>("faqs"),
    listJsonCollection<PropertyDifferentiator>("differentiators"),
  ]);

  // Hydrate legacy viewing rows with the V3 PASS 21 reminder/waitlist
  // fields. JSON records written before the schema bump won't carry
  // these keys; the rest of the system reads them via PropertyViewingRequest.
  const hydratedViewings: PropertyViewingRequest[] = viewingRequests.map((viewing) => {
    const row = viewing as Partial<PropertyViewingRequest> & PropertyViewingRequest;
    return {
      ...row,
      reminder24hAt: row.reminder24hAt ?? null,
      reminder24hSentAt: row.reminder24hSentAt ?? null,
      reminder1hAt: row.reminder1hAt ?? null,
      reminder1hSentAt: row.reminder1hSentAt ?? null,
      confirmedAt: row.confirmedAt ?? null,
      waitlistPosition: row.waitlistPosition ?? null,
      cancellationReason: row.cancellationReason ?? null,
    };
  });

  // Stage 1 — DB-backed listings (flag-gated, non-breaking). When PROPERTY_DB_LISTINGS is on and
  // the property_listings table has rows, they are the source of truth; otherwise fall back to the
  // Storage snapshot so the live site is identical to today.
  const dbListings = isPropertyDbListingsEnabled() ? await listListingsFromDb() : [];
  const effectiveListings = dbListings.length > 0 ? dbListings : listings;

  const snapshot = {
    areas: dedupeById(areas),
    agents: dedupeById(agents),
    listings: dedupeById(effectiveListings),
    inquiries,
    viewingRequests: hydratedViewings,
    applications,
    inspections,
    policyEvents,
    managedRecords: dedupeById(managedRecords),
    campaigns: dedupeById(campaigns),
    notifications,
    savedListings,
    savedSearches,
    rentPayments,
    maintenanceTickets,
    services: services.length ? services : demoPropertySnapshot.services,
    faqs: faqs.length ? faqs : demoPropertySnapshot.faqs,
    differentiators: differentiators.length ? differentiators : demoPropertySnapshot.differentiators,
  } satisfies Omit<PropertySnapshot, "metrics">;

    const value = {
      metrics: buildRuntimeMetrics(snapshot),
      ...snapshot,
    };

    propertySnapshotCache = {
      value,
      // Cache the catalog snapshot in-process for 60s. Reading it means a
      // fan-out of per-file Supabase Storage downloads across ~18 folders, so
      // re-running it on every request made cold public loads take ~15s. Every
      // mutation calls invalidatePropertySnapshotCache(), so writes are still
      // reflected immediately within this worker; the short TTL only bounds
      // cross-worker staleness for read-only public traffic.
      expiresAt: Date.now() + 60_000,
    };

    return value;
  })();

  try {
    return await propertySnapshotPromise;
  } finally {
    propertySnapshotPromise = null;
  }
}

export async function seedPropertyRuntimeSnapshot(snapshot: PropertySnapshot = demoPropertySnapshot) {
  await ensurePropertyBuckets();

  for (const area of snapshot.areas) await writeJsonRecord("areas", area.id, area);
  for (const agent of snapshot.agents) await writeJsonRecord("agents", agent.id, agent);
  for (const listing of snapshot.listings) await writeJsonRecord("listings", listing.id, listing);
  for (const record of snapshot.managedRecords) {
    await writeJsonRecord("managed-records", record.id, record);
  }
  for (const campaign of snapshot.campaigns) await writeJsonRecord("campaigns", campaign.id, campaign);
  for (const service of snapshot.services) await writeJsonRecord("services", service.id, service);
  for (const faq of snapshot.faqs) await writeJsonRecord("faqs", faq.id, faq);
  for (const differentiator of snapshot.differentiators) {
    await writeJsonRecord("differentiators", differentiator.id, differentiator);
  }
}

export async function upsertPropertyListing(listing: PropertyListing) {
  const record: PropertyListing = {
    ...listing,
    normalizedEmail: normalizeEmail(listing.normalizedEmail || listing.ownerEmail),
    ownerPhone: normalizePhone(listing.ownerPhone),
    ownerEmail: normalizeEmail(listing.ownerEmail),
    updatedAt: new Date().toISOString(),
  };
  await writeJsonRecord("listings", listing.id, record);
  // Stage 2 — dual-write the DB row (flag-gated, best-effort; never touches henry_onyx_verified).
  await writeListingToDb(record);
}

export async function upsertPropertyInspection(inspection: PropertyListingInspection) {
  await writeJsonRecord("inspections", inspection.id, {
    ...inspection,
    updatedAt: new Date().toISOString(),
  } satisfies PropertyListingInspection);
}

export async function appendPropertyPolicyEvent(event: Omit<PropertyPolicyEvent, "id" | "createdAt">) {
  const payload: PropertyPolicyEvent = {
    id: createId(),
    createdAt: new Date().toISOString(),
    ...event,
  };

  await writeJsonRecord("policy-events", payload.id, payload);
  return payload;
}

export async function upsertPropertyInquiry(inquiry: PropertyInquiry) {
  await writeJsonRecord("inquiries", inquiry.id, {
    ...inquiry,
    normalizedEmail: normalizeEmail(inquiry.normalizedEmail || inquiry.email),
    phone: normalizePhone(inquiry.phone),
    updatedAt: new Date().toISOString(),
  } satisfies PropertyInquiry);
}

export async function upsertPropertyViewingRequest(viewing: PropertyViewingRequest) {
  await writeJsonRecord("viewings", viewing.id, {
    ...viewing,
    normalizedEmail: normalizeEmail(viewing.normalizedEmail || viewing.attendeeEmail),
    attendeePhone: normalizePhone(viewing.attendeePhone),
    updatedAt: new Date().toISOString(),
  } satisfies PropertyViewingRequest);
}

export async function upsertPropertyApplication(application: PropertyListingApplication) {
  await writeJsonRecord("applications", application.id, {
    ...application,
    normalizedEmail: normalizeEmail(application.normalizedEmail || application.email),
    updatedAt: new Date().toISOString(),
  } satisfies PropertyListingApplication);
}

export async function upsertPropertyManagedRecord(record: PropertyManagedRecord) {
  await writeJsonRecord("managed-records", record.id, {
    ...record,
    updatedAt: new Date().toISOString(),
  } satisfies PropertyManagedRecord);
}

export async function upsertPropertyCampaign(campaign: PropertyFeaturedCampaign) {
  await writeJsonRecord("campaigns", campaign.id, campaign);
}

export async function appendPropertyNotification(notification: Omit<PropertyNotificationRecord, "id" | "createdAt">) {
  const payload: PropertyNotificationRecord = {
    id: createId(),
    createdAt: new Date().toISOString(),
    ...notification,
  };

  await writeJsonRecord("notifications", payload.id, payload);
  return payload;
}

export async function savePropertyForUser(userId: string, listingId: string) {
  const record: PropertySavedListing = {
    id: `${userId}--${listingId}`,
    userId,
    listingId,
    createdAt: new Date().toISOString(),
  };

  await writeJsonRecord("saved-listings", record.id, record);
  return record;
}

export async function removeSavedPropertyForUser(userId: string, listingId: string) {
  await removeJsonRecord("saved-listings", `${userId}--${listingId}`);
}

/* ──────────────────────────────────────────────────────────────────
 * V3 PASS 21 — saved-search storage helpers.
 * The `property-saved-searches` bucket subfolder mirrors the SQL
 * `property_saved_searches` table for environments running on JSON
 * runtime storage. Migrating to direct Supabase queries is a
 * follow-on once the storage runtime is retired.
 * ────────────────────────────────────────────────────────────────── */
export async function upsertPropertySavedSearch(saved: PropertySavedSearch) {
  await writeJsonRecord("saved-searches", saved.id, {
    ...saved,
    normalizedEmail: normalizeEmail(saved.normalizedEmail),
    updatedAt: new Date().toISOString(),
  } satisfies PropertySavedSearch);
}

export async function removePropertySavedSearch(id: string) {
  await removeJsonRecord("saved-searches", id);
}

export async function listPropertySavedSearchesForUser(userId: string) {
  const snapshot = await readPropertyRuntimeSnapshot();
  return snapshot.savedSearches.filter((row) => row.userId === userId);
}

/* ──────────────────────────────────────────────────────────────────
 * V3 PASS 21 — managed rent payment storage helpers.
 * Tracks the rent ledger for managed-property statements.
 * ────────────────────────────────────────────────────────────────── */
export async function upsertPropertyRentPayment(payment: PropertyRentPayment) {
  await writeJsonRecord("rent-payments", payment.id, {
    ...payment,
    normalizedEmail: normalizeEmail(payment.normalizedEmail),
    updatedAt: new Date().toISOString(),
  } satisfies PropertyRentPayment);
}

/* ──────────────────────────────────────────────────────────────────
 * V3 PASS 21 — managed maintenance ticket helpers.
 * Tracks tickets reported by managed-property owners.
 * ────────────────────────────────────────────────────────────────── */
export async function upsertPropertyMaintenanceTicket(ticket: PropertyMaintenanceTicket) {
  await writeJsonRecord("maintenance-tickets", ticket.id, {
    ...ticket,
    normalizedEmail: normalizeEmail(ticket.normalizedEmail),
    updatedAt: new Date().toISOString(),
  } satisfies PropertyMaintenanceTicket);
}

export async function createListingFromSubmission(input: {
  title: string;
  summary: string;
  description: string;
  kind: PropertyListing["kind"];
  serviceType?: PropertyListing["serviceType"];
  intent?: PropertyListing["intent"];
  locationSlug: string;
  locationLabel: string;
  district: string;
  addressLine: string;
  price: number;
  currency?: string;
  priceInterval: string;
  bedrooms?: number | null;
  bathrooms?: number | null;
  sizeSqm?: number | null;
  parkingSpaces?: number | null;
  furnished?: boolean;
  petFriendly?: boolean;
  shortletReady?: boolean;
  managedByHenryCo?: boolean;
  ownerUserId?: string | null;
  normalizedEmail?: string | null;
  ownerName?: string | null;
  ownerPhone?: string | null;
  ownerEmail?: string | null;
  agentId?: string | null;
  featured?: boolean;
  gallery?: string[];
  amenities?: string[];
  riskScore?: number;
  riskFlags?: string[];
  policyVersion?: string;
  policySummary?: string | null;
}) {
  const listing: PropertyListing = {
    id: createId(),
    slug: slugify(input.title),
    title: cleanText(input.title),
    summary: cleanText(input.summary),
    description: cleanText(input.description),
    kind: input.kind,
    serviceType:
      input.serviceType ?? (input.kind === "managed" ? "managed_property" : input.kind),
    intent: input.intent ?? "owner_listed",
    status: "submitted",
    visibility: "private",
    locationSlug: cleanText(input.locationSlug),
    locationLabel: cleanText(input.locationLabel),
    district: cleanText(input.district),
    addressLine: cleanText(input.addressLine),
    price: Math.max(0, Math.round(Number(input.price || 0))),
    currency: cleanText(input.currency) || "NGN",
    priceInterval: cleanText(input.priceInterval),
    bedrooms: input.bedrooms ?? null,
    bathrooms: input.bathrooms ?? null,
    sizeSqm: input.sizeSqm ?? null,
    parkingSpaces: input.parkingSpaces ?? null,
    furnished: Boolean(input.furnished),
    petFriendly: Boolean(input.petFriendly),
    shortletReady: Boolean(input.shortletReady),
    managedByHenryCo: Boolean(input.managedByHenryCo),
    featured: Boolean(input.featured),
    promoted: false,
    heroImage: input.gallery?.[0] || PROPERTY_PLACEHOLDER_IMAGE,
    gallery: input.gallery?.length ? input.gallery : [PROPERTY_PLACEHOLDER_IMAGE],
    floorPlanUrl: null,
    amenities: input.amenities ?? [],
    trustBadges: [
      Boolean(input.managedByHenryCo) ? "Managed by Henry Onyx" : "Submission under review",
      "Owner verification pending",
    ],
    headlineMetrics: [
      input.bedrooms ? `${input.bedrooms} beds` : "Premium listing",
      input.sizeSqm ? `${input.sizeSqm} sqm` : "Editorial review",
    ],
    verificationNotes: ["Submitted for moderation"],
    riskScore: Math.max(0, Math.min(100, Math.round(Number(input.riskScore ?? 40)))),
    riskFlags: input.riskFlags ?? [],
    policyVersion: cleanText(input.policyVersion) || "v1",
    policySummary: input.policySummary ?? null,
    pricingRuleBookKey: null,
    pricingRuleVersion: null,
    feeBreakdown: null,
    availableFrom: null,
    availableNow: true,
    ownerUserId: input.ownerUserId ?? null,
    normalizedEmail: normalizeEmail(input.normalizedEmail || input.ownerEmail),
    ownerName: cleanText(input.ownerName) || null,
    ownerPhone: normalizePhone(input.ownerPhone),
    ownerEmail: normalizeEmail(input.ownerEmail),
    agentId: input.agentId ?? null,
    listedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await upsertPropertyListing(listing);
  return listing;
}
