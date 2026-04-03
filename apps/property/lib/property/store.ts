import "server-only";

import { createAdminSupabase } from "@/lib/supabase";
import { normalizeEmail, normalizePhone } from "@/lib/env";
import { slugify } from "@/lib/utils";
import { demoPropertySnapshot } from "@/lib/property/demo";
import type {
  PropertyAgent,
  PropertyArea,
  PropertyDifferentiator,
  PropertyFaq,
  PropertyFeaturedCampaign,
  PropertyInquiry,
  PropertyListing,
  PropertyListingApplication,
  PropertyManagedRecord,
  PropertyNotificationRecord,
  PropertySavedListing,
  PropertyService,
  PropertySnapshot,
  PropertyViewingRequest,
} from "@/lib/property/types";

export const PROPERTY_RUNTIME_BUCKET = "property-runtime";
export const PROPERTY_MEDIA_BUCKET = "property-media";
export const PROPERTY_DOCUMENT_BUCKET = "property-documents";
const PROPERTY_PLACEHOLDER_IMAGE =
  "https://images.unsplash.com/photo-1460317442991-0ec209397118?auto=format&fit=crop&w=1600&q=80";

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
  const approvedListings = input.listings.filter((listing) => listing.status === "approved").length;
  const managedPortfolio = input.managedRecords.filter((record) => record.status === "active").length;
  const viewingPipeline = input.viewingRequests.filter((request) =>
    ["requested", "scheduled", "confirmed"].includes(request.status)
  ).length;

  return [
    {
      label: "Live listings",
      value: String(approvedListings),
      hint: "Public inventory currently available on HenryCo Property.",
    },
    {
      label: "Managed portfolio",
      value: String(managedPortfolio),
      hint: "Active managed-property records tracked in HenryCo operations.",
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

export async function uploadPropertyMedia(listingId: string, file: File) {
  await ensurePropertyBuckets();
  const admin = createAdminSupabase();
  const filename = `${Date.now()}-${slugify(file.name || "media")}`;
  const path = `${listingId}/${filename}`;
  const bytes = await file.arrayBuffer();

  const { error } = await admin.storage.from(PROPERTY_MEDIA_BUCKET).upload(path, bytes, {
    contentType: file.type || "application/octet-stream",
    upsert: true,
  });

  if (error) {
    throw error;
  }

  return admin.storage.from(PROPERTY_MEDIA_BUCKET).getPublicUrl(path).data.publicUrl;
}

export async function uploadPropertyDocument(entityId: string, file: File) {
  await ensurePropertyBuckets();
  const admin = createAdminSupabase();
  const filename = `${Date.now()}-${slugify(file.name || "document")}`;
  const path = `${entityId}/${filename}`;
  const bytes = await file.arrayBuffer();

  const { error } = await admin.storage.from(PROPERTY_DOCUMENT_BUCKET).upload(path, bytes, {
    contentType: file.type || "application/octet-stream",
    upsert: true,
  });

  if (error) {
    throw error;
  }

  return `storage://${PROPERTY_DOCUMENT_BUCKET}/${path}`;
}

export async function readPropertyRuntimeSnapshot(): Promise<PropertySnapshot> {
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
    managedRecords,
    campaigns,
    notifications,
    savedListings,
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
    listJsonCollection<PropertyManagedRecord>("managed-records"),
    listJsonCollection<PropertyFeaturedCampaign>("campaigns"),
    listJsonCollection<PropertyNotificationRecord>("notifications"),
    listJsonCollection<PropertySavedListing>("saved-listings"),
    listJsonCollection<PropertyService>("services"),
    listJsonCollection<PropertyFaq>("faqs"),
    listJsonCollection<PropertyDifferentiator>("differentiators"),
  ]);

  const snapshot = {
    areas: dedupeById(areas),
    agents: dedupeById(agents),
    listings: dedupeById(listings),
    inquiries,
    viewingRequests,
    applications,
    managedRecords: dedupeById(managedRecords),
    campaigns: dedupeById(campaigns),
    notifications,
    savedListings,
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
      // Avoid serving stale listing state across worker processes after mutations.
      expiresAt: Date.now(),
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
  await writeJsonRecord("listings", listing.id, {
    ...listing,
    normalizedEmail: normalizeEmail(listing.normalizedEmail || listing.ownerEmail),
    ownerPhone: normalizePhone(listing.ownerPhone),
    ownerEmail: normalizeEmail(listing.ownerEmail),
    updatedAt: new Date().toISOString(),
  } satisfies PropertyListing);
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

export async function createListingFromSubmission(input: {
  title: string;
  summary: string;
  description: string;
  kind: PropertyListing["kind"];
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
}) {
  const listing: PropertyListing = {
    id: createId(),
    slug: slugify(input.title),
    title: cleanText(input.title),
    summary: cleanText(input.summary),
    description: cleanText(input.description),
    kind: input.kind,
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
      Boolean(input.managedByHenryCo) ? "Managed by HenryCo" : "Submission under review",
      "Owner verification pending",
    ],
    headlineMetrics: [
      input.bedrooms ? `${input.bedrooms} beds` : "Premium listing",
      input.sizeSqm ? `${input.sizeSqm} sqm` : "Editorial review",
    ],
    verificationNotes: ["Submitted for moderation"],
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
