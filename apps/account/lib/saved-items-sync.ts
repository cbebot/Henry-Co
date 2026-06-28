import "server-only";

import type {
  SavedItemDivision,
  SavedItemRecord,
  SavedItemSnapshotCore,
  SavedItemStatus,
} from "@henryco/cart-saved-items";
import { listSavedItems, removeSavedItem } from "@henryco/cart-saved-items/server";
import { getDivisionUrl, normalizeEmail } from "@henryco/config";

import { createAdminSupabase } from "@/lib/supabase";
import {
  getSavedPropertiesForUser,
  removeSavedPropertyForUser,
} from "@/lib/property-module";

type NativeSavedItemInput = {
  id: string;
  userId: string;
  division: SavedItemDivision;
  itemType: string;
  itemId: string;
  snapshot: SavedItemSnapshotCore & Record<string, unknown>;
  addedAt: string;
};

const MARKETPLACE_ORIGIN = getDivisionUrl("marketplace");
const JOBS_ORIGIN = getDivisionUrl("jobs");
const LEARN_ORIGIN = getDivisionUrl("learn");
const TTL_DAYS = 90;

function asText(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function asNullableText(value: unknown) {
  const text = typeof value === "string" ? value.trim() : "";
  return text || null;
}

function asNumber(value: unknown, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function safeIso(value: unknown) {
  const candidate = asText(value) || new Date().toISOString();
  const ms = Date.parse(candidate);
  return Number.isFinite(ms) ? new Date(ms).toISOString() : new Date().toISOString();
}

function expiresAt(addedAt: string) {
  return new Date(new Date(addedAt).getTime() + TTL_DAYS * 24 * 60 * 60 * 1000).toISOString();
}

function absoluteUrl(origin: string, href?: string | null) {
  const clean = asNullableText(href);
  if (!clean) return origin;
  if (/^https?:\/\//i.test(clean)) return clean;
  return `${origin.replace(/\/$/, "")}${clean.startsWith("/") ? clean : `/${clean}`}`;
}

function itemKey(item: Pick<SavedItemRecord, "division" | "itemType" | "itemId">) {
  return `${item.division}:${item.itemType}:${item.itemId}`;
}

function nativeRecord(input: NativeSavedItemInput): SavedItemRecord {
  const addedAt = safeIso(input.addedAt);
  const expiry = expiresAt(addedAt);
  const status: SavedItemStatus =
    new Date(expiry).getTime() <= Date.now() ? "expired" : "active";

  return {
    id: input.id,
    userId: input.userId,
    division: input.division,
    itemType: input.itemType,
    itemId: input.itemId,
    itemSnapshot: input.snapshot,
    sourceCartItemId: null,
    status,
    notes: null,
    addedAt,
    expiresAt: expiry,
    warnedAt: null,
    softDeletedAt: null,
    restoredToCartAt: null,
  };
}

function mergeUniqueSavedItems(
  canonical: SavedItemRecord[],
  nativeItems: SavedItemRecord[],
) {
  const seen = new Set(canonical.map(itemKey));
  const merged = [...canonical];
  for (const item of nativeItems) {
    const key = itemKey(item);
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(item);
  }
  return merged.sort(
    (left, right) =>
      new Date(right.addedAt).getTime() - new Date(left.addedAt).getTime(),
  );
}

export function groupSavedItemsByDivision(items: SavedItemRecord[]) {
  const groups: Record<string, SavedItemRecord[]> = {};
  for (const item of items) {
    if (!groups[item.division]) groups[item.division] = [];
    groups[item.division].push(item);
  }
  return groups;
}

export async function getUnifiedSavedItems(userId: string, email?: string | null) {
  const admin = createAdminSupabase();
  const normalizedEmail = normalizeEmail(email);
  const canonical = await listSavedItems(admin, userId, {
    includeStatuses: ["active", "expired"],
    limit: 500,
  });
  const nativeResults = await Promise.allSettled([
    readMarketplaceWishlist(userId, normalizedEmail),
    readJobsSavedItems(userId),
    readPropertySavedItems(userId),
    readLearnSavedItems(userId, normalizedEmail),
  ]);

  const nativeItems = nativeResults.flatMap((result) =>
    result.status === "fulfilled" ? result.value : [],
  );
  const all = mergeUniqueSavedItems(canonical, nativeItems);
  const active = all.filter((item) => item.status === "active");
  const expired = all.filter((item) => item.status === "expired");

  return {
    active,
    expired,
    grouped: groupSavedItemsByDivision(active),
  };
}

async function readMarketplaceWishlist(userId: string, normalizedEmail: string | null) {
  const admin = createAdminSupabase();
  const wishlistRows = await readIdentityRows("marketplace_wishlists", userId, normalizedEmail);
  const productIds = [
    ...new Set(
      wishlistRows
        .map((row) => asNullableText(row.product_id))
        .filter((value): value is string => Boolean(value)),
    ),
  ];
  if (productIds.length === 0) return [];

  const [{ data: products }, { data: media }] = await Promise.all([
    admin
      .from("marketplace_products")
      .select("id, slug, title, summary, base_price, compare_at_price, currency, status")
      .in("id", productIds),
    admin
      .from("marketplace_product_media")
      .select("product_id, url, is_primary, sort_order")
      .in("product_id", productIds)
      .eq("kind", "image")
      .order("sort_order", { ascending: true }),
  ]);

  const mediaByProduct = new Map<string, string>();
  for (const item of (media ?? []) as Array<Record<string, unknown>>) {
    const productId = asText(item.product_id);
    const url = asNullableText(item.url);
    if (!productId || !url) continue;
    if (item.is_primary === true || !mediaByProduct.has(productId)) {
      mediaByProduct.set(productId, url);
    }
  }

  const productById = new Map(
    ((products ?? []) as Array<Record<string, unknown>>).map((product) => [
      asText(product.id),
      product,
    ]),
  );

  return wishlistRows
    .map((row) => {
      const productId = asText(row.product_id);
      const product = productById.get(productId);
      if (!product) return null;
      const slug = asText(product.slug);
      return nativeRecord({
        id: `marketplace-wishlist:${asText(row.id)}`,
        userId,
        division: "marketplace",
        itemType: "product",
        itemId: productId,
        addedAt: safeIso(row.created_at),
        snapshot: {
          title: asText(product.title, "Marketplace item"),
          subtitle: asNullableText(product.summary),
          image: mediaByProduct.get(productId) ?? null,
          href: absoluteUrl(MARKETPLACE_ORIGIN, slug ? `/product/${slug}` : "/"),
          priceKobo: Math.round(asNumber(product.base_price) * 100),
          compareAtKobo:
            product.compare_at_price == null
              ? null
              : Math.round(asNumber(product.compare_at_price) * 100),
          currency: asText(product.currency, "NGN"),
          vendorName: null,
          source: "marketplace_wishlist",
          productSlug: slug,
        },
      });
    })
    .filter((item): item is SavedItemRecord => Boolean(item));
}

async function readJobsSavedItems(userId: string) {
  const admin = createAdminSupabase();
  const { data } = await admin
    .from("customer_activity")
    .select("id, created_at, metadata, reference_id, action_url")
    .eq("user_id", userId)
    .eq("division", "jobs")
    .eq("activity_type", "jobs_saved_post")
    .eq("status", "saved")
    .order("created_at", { ascending: false })
    .limit(500);

  return ((data ?? []) as Array<Record<string, unknown>>)
    .map((row) => {
      const metadata = asObject(row.metadata);
      const slug =
        asNullableText(metadata.jobSlug) ||
        asNullableText(metadata.slug) ||
        asNullableText(row.reference_id) ||
        asText(row.id);
      if (!slug) return null;
      return nativeRecord({
        id: `jobs:${asText(row.id)}`,
        userId,
        division: "jobs",
        itemType: "job",
        itemId: slug,
        addedAt: safeIso(row.created_at),
        snapshot: {
          title: asText(metadata.jobTitle || metadata.title, "Saved role"),
          subtitle: [
            asNullableText(metadata.location),
            asNullableText(metadata.employmentType),
          ]
            .filter(Boolean)
            .join(" · "),
          image: null,
          href: absoluteUrl(JOBS_ORIGIN, asNullableText(row.action_url) || `/jobs/${slug}`),
          priceKobo: null,
          currency: "NGN",
          vendorName: asNullableText(metadata.employerName),
          employerSlug: asNullableText(metadata.employerSlug),
          source: "jobs_saved_post",
        },
      });
    })
    .filter((item): item is SavedItemRecord => Boolean(item));
}

async function readPropertySavedItems(userId: string) {
  const saved = await getSavedPropertiesForUser(userId);
  return saved.map((property) =>
    nativeRecord({
      id: `property:${property.listingId}`,
      userId,
      division: "property",
      itemType: "property_listing",
      itemId: property.listingId,
      addedAt: property.savedAt,
      snapshot: {
        title: property.title,
        subtitle: [property.kind, property.location].filter(Boolean).join(" · "),
        image: property.heroImage || null,
        href: property.detailUrl,
        priceKobo: Math.round(asNumber(property.price) * 100),
        currency: property.currency || "NGN",
        vendorName: property.managedByHenryCo ? "Henry & Co. Property" : null,
        listingSlug: property.slug,
        source: "property_saved_listing",
      },
    }),
  );
}

async function readLearnSavedItems(
  userId: string,
  normalizedEmail: string | null,
) {
  const admin = createAdminSupabase();
  const savedRows = await readIdentityRows("learn_saved_courses", userId, normalizedEmail);
  const courseIds = [
    ...new Set(
      savedRows
        .map((row) => asNullableText(row.course_id))
        .filter((value): value is string => Boolean(value)),
    ),
  ];
  if (courseIds.length === 0) return [];

  const { data: courses } = await admin
    .from("learn_courses")
    .select("id, slug, title, subtitle, summary, hero_image_url, price, currency")
    .in("id", courseIds);

  const courseById = new Map(
    ((courses ?? []) as Array<Record<string, unknown>>).map((course) => [
      asText(course.id),
      course,
    ]),
  );

  return savedRows
    .map((row) => {
      const courseId = asText(row.course_id);
      const course = courseById.get(courseId);
      if (!course) return null;
      const slug = asText(course.slug);
      return nativeRecord({
        id: `learn-saved:${asText(row.id)}`,
        userId,
        division: "learn",
        itemType: "course",
        itemId: courseId,
        addedAt: safeIso(row.created_at),
        snapshot: {
          title: asText(course.title, "Saved course"),
          subtitle: asNullableText(course.subtitle) || asNullableText(course.summary),
          image: asNullableText(course.hero_image_url),
          href: absoluteUrl(LEARN_ORIGIN, slug ? `/courses/${slug}` : "/courses"),
          priceKobo:
            course.price == null ? null : Math.round(asNumber(course.price) * 100),
          currency: asText(course.currency, "NGN"),
          vendorName: "Henry & Co. Academy",
          courseSlug: slug,
          source: "learn_saved_courses",
        },
      });
    })
    .filter((item): item is SavedItemRecord => Boolean(item));
}

async function readIdentityRows(
  table: "marketplace_wishlists" | "learn_saved_courses",
  userId: string,
  normalizedEmail: string | null,
) {
  const admin = createAdminSupabase();
  const [byUser, byEmail] = await Promise.all([
    admin.from(table).select("*").eq("user_id", userId),
    normalizedEmail
      ? admin.from(table).select("*").eq("normalized_email", normalizedEmail)
      : Promise.resolve({ data: [] }),
  ]);
  const rows = [
    ...((byUser.data ?? []) as Array<Record<string, unknown>>),
    ...((byEmail.data ?? []) as Array<Record<string, unknown>>),
  ];
  const seen = new Set<string>();
  return rows.filter((row) => {
    const id = asText(row.id);
    if (!id || seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

export function isCartRestorableSavedItem(item: SavedItemRecord) {
  return item.division === "marketplace" && !item.id.includes(":");
}

export async function removeUnifiedSavedItem(
  userId: string,
  email: string | null | undefined,
  savedItemId: string,
) {
  const admin = createAdminSupabase();
  const normalizedEmail = normalizeEmail(email);

  if (savedItemId.startsWith("property:")) {
    const listingId = savedItemId.slice("property:".length);
    if (!listingId) return false;
    await removeSavedPropertyForUser(userId, listingId);
    return true;
  }

  if (savedItemId.startsWith("jobs:")) {
    const activityId = savedItemId.slice("jobs:".length);
    if (!activityId) return false;
    const { error } = await admin
      .from("customer_activity")
      .update({ status: "removed" })
      .eq("id", activityId)
      .eq("user_id", userId)
      .eq("division", "jobs")
      .eq("activity_type", "jobs_saved_post");
    return !error;
  }

  if (savedItemId.startsWith("marketplace-wishlist:")) {
    return deleteOwnedIdentityRow(
      "marketplace_wishlists",
      savedItemId.slice("marketplace-wishlist:".length),
      userId,
      normalizedEmail,
    );
  }

  if (savedItemId.startsWith("learn-saved:")) {
    return deleteOwnedIdentityRow(
      "learn_saved_courses",
      savedItemId.slice("learn-saved:".length),
      userId,
      normalizedEmail,
    );
  }

  return removeSavedItem(admin, userId, savedItemId);
}

async function deleteOwnedIdentityRow(
  table: "marketplace_wishlists" | "learn_saved_courses",
  rowId: string,
  userId: string,
  normalizedEmail: string | null,
) {
  if (!rowId) return false;
  const admin = createAdminSupabase();
  const { data } = await admin.from(table).select("id, user_id, normalized_email").eq("id", rowId).maybeSingle();
  const row = data as Record<string, unknown> | null;
  const ownsByUser = asText(row?.user_id) === userId;
  const ownsByEmail = Boolean(normalizedEmail && asText(row?.normalized_email) === normalizedEmail);
  if (!row || (!ownsByUser && !ownsByEmail)) return false;
  const { error } = await admin.from(table).delete().eq("id", rowId);
  return !error;
}
