import "server-only";

/**
 * Henry Onyx Marketplace — idempotent catalog auto-seed.
 *
 * The public read layer (`./data.ts`) shows whatever approved catalog
 * lives in the DB; in production that was empty, so the storefront read
 * "0 stores · 0 listings". This bootstrap writes the company's own
 * curated store + goods (see `./seed-catalog.ts`) into the live catalog
 * tables on first read, exactly once per content version.
 *
 * Properties (mirrors the proven `apps/learn` bootstrap):
 *   - Idempotent: every write is an upsert keyed on a stable slug/id, so
 *     re-running only refreshes content — never duplicates.
 *   - Version-gated: skips entirely once `marketplace_settings.bootstrap_version`
 *     matches `MARKETPLACE_SEED_VERSION`; bump the version to re-apply.
 *   - Service-role-guarded: without the service-role key it no-ops, so a
 *     misconfigured deploy still renders (empty) rather than 500-ing.
 *   - Schema-drift-resilient: `writeWithSchemaRetry` strips any column the
 *     live table is missing and retries (committed schema can lag prod).
 *   - Catalog only: NO orders/payments are written, so checkout stays
 *     dormant (FL2) and ₦0 can move.
 *   - Additive/refresh-only: this upserts; it does NOT auto-retire rows
 *     dropped from the catalog in a later version (auto-deletion would
 *     risk nuking manually-managed listings). Retire a removed company
 *     listing with a deliberate step.
 */

import { getOptionalEnv } from "@/lib/env";
import { createAdminSupabase } from "@/lib/supabase";
import {
  MARKETPLACE_SEED_VERSION,
  henryOnyxStore,
  houseBrand,
  seedCampaigns,
  seedCategories,
  seedCollections,
  seedProducts,
  seedReviews,
  seedUuid,
} from "@/lib/marketplace/seed-catalog";

const SETTINGS_TABLE = "marketplace_settings";
const BOOTSTRAP_KEY = "bootstrap_version";

let bootstrapPromise: Promise<void> | null = null;
let verifiedCurrent = false;

function hasServiceRole() {
  return Boolean(getOptionalEnv("SUPABASE_SERVICE_ROLE_KEY"));
}

function cleanText(value: unknown) {
  return String(value ?? "").trim();
}

/** Strip a column the live table doesn't have, then retry — committed
 *  schema can lag prod, and the storefront must never crash on a seed. */
function extractMissingColumn(error: unknown, table: string): string | null {
  const message = cleanText((error as { message?: string } | null)?.message);
  const match = message.match(/Could not find the '([^']+)' column of '([^']+)'/i);
  if (!match) return null;
  if (cleanText(match[2]) && cleanText(match[2]) !== cleanText(table)) return null;
  return cleanText(match[1]) || null;
}

async function writeWithSchemaRetry(
  table: string,
  rows: Record<string, unknown>[],
  operation: (next: Record<string, unknown>[]) => Promise<{ error: unknown }>,
) {
  let next = rows.map((row) => ({ ...row }));
  const stripped = new Set<string>();
  for (;;) {
    const { error } = await operation(next);
    if (!error) return;
    const missing = extractMissingColumn(error, table);
    if (!missing || stripped.has(missing)) throw error;
    next = next.map((row) => {
      if (!(missing in row)) return row;
      const copy = { ...row };
      delete copy[missing];
      return copy;
    });
    stripped.add(missing);
  }
}

type Admin = ReturnType<typeof createAdminSupabase>;

/** Batched, schema-drift-resilient upsert: one round-trip per table. */
async function upsert(
  admin: Admin,
  table: string,
  rows: Record<string, unknown>[],
  onConflict: string,
) {
  if (rows.length === 0) return;
  await writeWithSchemaRetry(table, rows, async (next) =>
    admin.from(table).upsert(next as never, { onConflict }),
  );
}

async function slugIdMap(admin: Admin, table: string) {
  const { data, error } = await admin.from(table).select("id, slug");
  if (error) throw error;
  return new Map((data ?? []).map((r: { id: unknown; slug: unknown }) => [cleanText(r.slug), cleanText(r.id)]));
}

/**
 * Seed (or refresh) the curated company catalog. Safe to call repeatedly.
 */
export async function seedMarketplaceBaseline(): Promise<void> {
  const admin = createAdminSupabase();

  // 1) Store, house brand, categories (keyed on slug).
  await upsert(admin, "marketplace_vendors", [
    {
      slug: henryOnyxStore.slug,
      name: henryOnyxStore.name,
      description: henryOnyxStore.description,
      owner_type: henryOnyxStore.owner_type,
      status: henryOnyxStore.status,
      verification_level: henryOnyxStore.verification_level,
      // Set BEFORE the products are inserted (step 3) so the per-tier
      // listing-cap trigger reads "partner" (cap 9999) and never blocks
      // the company's own catalog. Stripped on legacy DBs lacking it.
      seller_tier: henryOnyxStore.seller_tier,
      trust_score: henryOnyxStore.trust_score,
      response_sla_hours: henryOnyxStore.response_sla_hours,
      fulfillment_rate: henryOnyxStore.fulfillment_rate,
      dispute_rate: henryOnyxStore.dispute_rate,
      review_score: henryOnyxStore.review_score,
      followers_count: henryOnyxStore.followers_count,
      accent: henryOnyxStore.accent,
      hero_image_url: henryOnyxStore.hero_image_url,
      badges: henryOnyxStore.badges,
      support_email: henryOnyxStore.support_email,
      support_phone: henryOnyxStore.support_phone,
    },
  ], "slug");

  await upsert(admin, "marketplace_brands", [
    { slug: houseBrand.slug, name: houseBrand.name, description: houseBrand.description, accent: houseBrand.accent },
  ], "slug");

  await upsert(
    admin,
    "marketplace_categories",
    seedCategories.map((c) => ({
      slug: c.slug,
      name: c.name,
      description: c.description,
      hero_copy: c.hero_copy,
      sort_order: c.sort_order,
      is_featured: c.is_featured,
      filter_presets: c.filter_presets,
      trust_notes: c.trust_notes,
      product_count: seedProducts.filter((p) => p.categorySlug === c.slug).length,
    })),
    "slug",
  );

  // 2) Resolve foreign keys.
  const [categoryIds, brandIds, vendorIds] = await Promise.all([
    slugIdMap(admin, "marketplace_categories"),
    slugIdMap(admin, "marketplace_brands"),
    slugIdMap(admin, "marketplace_vendors"),
  ]);
  const storeId = vendorIds.get(henryOnyxStore.slug) ?? null;
  const brandId = brandIds.get(houseBrand.slug) ?? null;

  // 3) Products (keyed on slug).
  //
  // NOTE (V3-VAT-CLASSIFICATION-01): `SeedProduct.taxTreatment` is an OPTIONAL
  // per-item VAT switch on the catalog DATA only — it is deliberately NOT mapped
  // to a persisted column here, so this seed writes no new column and the existing
  // bootstrap_version need not bump. The VAT engine reads `taxTreatment` directly
  // from the catalog (as `resolveVatClassification`'s highest-precedence
  // `itemTreatment`); these curated rows are the owner's pre-launch TEST catalog
  // and resolve EXEMPT via the resolver's `isSeededTestItem` path. The "is this an
  // owner test item?" marker already lives at the catalog level (step 8:
  // `launch_state:"seeded"` + `bootstrap_version`) plus `inventory_owner_type:
  // "company"` per row — no per-row seeded flag is added. Persist a real
  // `tax_treatment` column only when checkout collection activates at go-live.
  await upsert(
    admin,
    "marketplace_products",
    seedProducts.map((p) => ({
      slug: p.slug,
      title: p.title,
      summary: p.summary,
      description: p.description,
      category_id: categoryIds.get(p.categorySlug) ?? null,
      brand_id: brandId,
      vendor_id: storeId,
      inventory_owner_type: "company",
      base_price: p.basePrice,
      compare_at_price: p.compareAtPrice,
      currency: "NGN",
      total_stock: p.stock,
      sku: p.sku,
      rating: p.rating,
      review_count: p.reviewCount,
      featured: p.featured,
      approval_status: "approved",
      status: "active",
      trust_badges: p.trustBadges,
      specifications: p.specifications,
      filter_data: {
        delivery: p.leadTime,
        verifiedSeller: true,
        companyOwned: true,
        codEligible: p.codEligible,
      },
      delivery_note: p.deliveryNote,
      lead_time: p.leadTime,
      cod_eligible: p.codEligible,
      reviewed_at: new Date().toISOString(),
    })),
    "slug",
  );

  const productIds = await slugIdMap(admin, "marketplace_products");

  // 4) Product media (stable ids so re-seeds don't duplicate).
  const mediaRows = seedProducts.flatMap((p, pi) => {
    const productId = productIds.get(p.slug);
    if (!productId) return [];
    return p.gallery.map((url, mi) => ({
      id: seedUuid("10000000", pi * 100 + mi),
      product_id: productId,
      kind: "image",
      url,
      is_primary: mi === 0,
      sort_order: mi,
    }));
  });
  await upsert(admin, "marketplace_product_media", mediaRows, "id");

  // 5) Collections + items.
  await upsert(
    admin,
    "marketplace_collections",
    seedCollections.map((c) => ({
      slug: c.slug,
      title: c.title,
      description: c.description,
      kicker: c.kicker,
      highlight: c.highlight,
    })),
    "slug",
  );
  const collectionIds = await slugIdMap(admin, "marketplace_collections");
  const collectionItemRows = seedCollections.flatMap((c, ci) => {
    const collectionId = collectionIds.get(c.slug);
    if (!collectionId) return [];
    return c.productSlugs
      .map((slug, ii) => {
        const productId = productIds.get(slug);
        if (!productId) return null;
        return {
          id: seedUuid("20000000", ci * 100 + ii),
          collection_id: collectionId,
          product_id: productId,
          sort_order: ii,
        };
      })
      .filter((row): row is NonNullable<typeof row> => row !== null);
  });
  await upsert(admin, "marketplace_collection_items", collectionItemRows, "id");

  // 6) Campaigns (keyed on slug).
  await upsert(
    admin,
    "marketplace_campaigns",
    seedCampaigns.map((c) => ({
      slug: c.slug,
      title: c.title,
      description: c.description,
      surface: c.surface,
      accent: c.accent,
      cta_label: c.cta_label,
      cta_href: c.cta_href,
      countdown_text: c.countdown_text,
      status: "active",
    })),
    "slug",
  );

  // 7) Reviews on hero items — decorative, so best-effort: a constraint
  //    mismatch (e.g. a required order_item_id, since we seed no orders)
  //    must never block the catalog or the version marker below.
  try {
    const reviewRows = seedReviews
      .map((r, ri) => {
        const productId = productIds.get(r.productSlug);
        if (!productId) return null;
        return {
          id: seedUuid("30000000", ri),
          product_id: productId,
          vendor_id: storeId,
          buyer_name: r.buyer_name,
          rating: r.rating,
          title: r.title,
          body: r.body,
          media: [],
          is_verified_purchase: true,
          status: "published",
          created_at: new Date(Date.now() - r.hoursAgo * 3600_000).toISOString(),
        };
      })
      .filter((row): row is NonNullable<typeof row> => row !== null);
    await upsert(admin, "marketplace_reviews", reviewRows, "id");
  } catch (err) {
    console.warn("[henryco/marketplace] seed reviews skipped:", err);
  }

  // 8) Settings + version marker (last, so a partial failure re-runs).
  await upsert(
    admin,
    SETTINGS_TABLE,
    [
      { key: "support_email", value: { value: henryOnyxStore.support_email } },
      { key: "support_phone", value: { value: henryOnyxStore.support_phone } },
      { key: "launch_state", value: { state: "seeded" } },
      { key: BOOTSTRAP_KEY, value: { version: MARKETPLACE_SEED_VERSION } },
    ],
    "key",
  );
}

async function currentBootstrapVersion(): Promise<string | null> {
  try {
    const admin = createAdminSupabase();
    const { data, error } = await admin
      .from(SETTINGS_TABLE)
      .select("value")
      .eq("key", BOOTSTRAP_KEY)
      .maybeSingle();
    if (error) return null;
    const value = data?.value as { version?: string } | null;
    return cleanText(value?.version) || null;
  } catch {
    return null;
  }
}

/**
 * Ensure the curated catalog exists before the storefront reads it.
 * Cheap and safe to call on every public load: it short-circuits once the
 * current version is confirmed, memoizes the in-flight seed, and swallows
 * failures (logged) so the page never 500s on a seeding hiccup.
 */
export async function ensureMarketplaceBootstrap(): Promise<void> {
  if (verifiedCurrent) return;
  if (!hasServiceRole()) return;

  const version = await currentBootstrapVersion();
  if (version === MARKETPLACE_SEED_VERSION) {
    verifiedCurrent = true;
    return;
  }

  if (!bootstrapPromise) {
    bootstrapPromise = (async () => {
      try {
        await seedMarketplaceBaseline();
        verifiedCurrent = true;
      } catch (err) {
        console.error("[henryco/marketplace] catalog bootstrap failed:", err);
      } finally {
        bootstrapPromise = null;
      }
    })();
  }
  await bootstrapPromise;
}
