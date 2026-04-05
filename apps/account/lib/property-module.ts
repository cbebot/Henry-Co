import "server-only";

import { getDivisionUrl } from "@henryco/config";
import { createAdminSupabase } from "@/lib/supabase";

const PROPERTY_RUNTIME_BUCKET = "property-runtime";
const PROPERTY_ORIGIN = getDivisionUrl("property");

type PropertySavedRecord = {
  id: string;
  userId: string;
  listingId: string;
  createdAt: string;
};

type PropertyListingRecord = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  kind: string;
  status: string;
  locationLabel: string;
  district: string;
  price: number;
  currency: string;
  priceInterval: string;
  heroImage: string;
  managedByHenryCo: boolean;
  featured: boolean;
  promoted: boolean;
  bedrooms: number | null;
  bathrooms: number | null;
  sizeSqm: number | null;
  updatedAt: string;
};

async function listJsonCollection<T>(folder: string) {
  const admin = createAdminSupabase();
  const { data: files } = await admin.storage.from(PROPERTY_RUNTIME_BUCKET).list(folder, {
    limit: 500,
    sortBy: { column: "name", order: "asc" },
  });

  const jsonFiles = (files ?? []).filter((file) => file.name.endsWith(".json"));
  const results = await Promise.all(
    jsonFiles.map(async (file) => {
      const { data } = await admin.storage
        .from(PROPERTY_RUNTIME_BUCKET)
        .download(`${folder}/${file.name}`);
      if (!data) return null;
      return JSON.parse(await data.text()) as T;
    })
  );

  return results.filter(Boolean) as T[];
}

export type SavedPropertyCard = {
  saveId: string;
  savedAt: string;
  lastUpdatedAt: string;
  listingId: string;
  slug: string;
  title: string;
  summary: string;
  kind: string;
  status: string;
  location: string;
  district: string;
  price: number;
  currency: string;
  priceInterval: string;
  heroImage: string;
  managedByHenryCo: boolean;
  featured: boolean;
  promoted: boolean;
  bedrooms: number | null;
  bathrooms: number | null;
  sizeSqm: number | null;
  detailUrl: string;
  inquiryUrl: string;
};

export async function getSavedPropertiesForUser(userId: string) {
  const [savedRecords, listings] = await Promise.all([
    listJsonCollection<PropertySavedRecord>("saved-listings"),
    listJsonCollection<PropertyListingRecord>("listings"),
  ]);

  const listingMap = new Map(listings.map((listing) => [listing.id, listing]));

  return savedRecords
    .filter((record) => record.userId === userId)
    .map((record) => {
      const listing = listingMap.get(record.listingId);
      if (!listing) return null;

      return {
        saveId: record.id,
        savedAt: record.createdAt,
        lastUpdatedAt: listing.updatedAt,
        listingId: listing.id,
        slug: listing.slug,
        title: listing.title,
        summary: listing.summary,
        kind: listing.kind,
        status: listing.status,
        location: listing.locationLabel,
        district: listing.district,
        price: listing.price,
        currency: listing.currency || "NGN",
        priceInterval: listing.priceInterval,
        heroImage: listing.heroImage,
        managedByHenryCo: listing.managedByHenryCo,
        featured: listing.featured,
        promoted: listing.promoted,
        bedrooms: listing.bedrooms,
        bathrooms: listing.bathrooms,
        sizeSqm: listing.sizeSqm,
        detailUrl: `${PROPERTY_ORIGIN}/property/${listing.slug}`,
        inquiryUrl: `${PROPERTY_ORIGIN}/property/${listing.slug}#inquiry`,
      };
    })
    .filter(Boolean)
    .sort((a, b) => new Date(b!.savedAt).getTime() - new Date(a!.savedAt).getTime()) as SavedPropertyCard[];
}

export async function removeSavedPropertyForUser(userId: string, listingId: string) {
  const admin = createAdminSupabase();
  await admin.storage
    .from(PROPERTY_RUNTIME_BUCKET)
    .remove([`saved-listings/${userId}--${listingId}.json`]);

  await admin.from("customer_activity").insert({
    user_id: userId,
    division: "property",
    activity_type: "property_unsaved",
    title: "Saved property removed",
    description: "A property was removed from the shared shortlist.",
    status: "completed",
    reference_type: "property_listing",
    reference_id: listingId,
    action_url: "/property/saved",
    metadata: {
      listingId,
      removedAt: new Date().toISOString(),
    },
  } as never);
}
