import "server-only";

import { cookies } from "next/headers";
import { getOptionalEnv } from "@/lib/env";
import {
  computePayoutBalance,
  deriveSellerTrustProfile,
  titleCaseMarketplaceValue,
} from "@/lib/marketplace/governance";
import { createAdminSupabase } from "@/lib/supabase";
import {
  demoHomeData,
} from "@/lib/marketplace/demo";
import { getMarketplaceViewer } from "@/lib/marketplace/auth";
import type {
  MarketplaceAddress,
  MarketplaceBrand,
  MarketplaceCampaign,
  MarketplaceCartItem,
  MarketplaceCategory,
  MarketplaceCollection,
  MarketplaceDispute,
  MarketplaceHomeData,
  MarketplaceNotification,
  MarketplaceOrder,
  MarketplaceOrderFeedItem,
  MarketplacePaymentRecord,
  MarketplacePayoutRequest,
  MarketplaceProduct,
  MarketplaceReview,
  MarketplaceShellCartItem,
  MarketplaceShellState,
  MarketplaceSupportThread,
  MarketplaceVendor,
  MarketplaceVendorApplication,
  MarketplaceViewerContext,
} from "@/lib/marketplace/types";

type Snapshot = MarketplaceHomeData;
type IdentityScopeOps<T> = T & {
  or: (filter: string) => T;
  eq: (column: string, value: string | null) => T;
};

const emptyHomeData: Snapshot = {
  kpis: [
    {
      label: "Verified stores",
      value: "0",
      hint: "The seller base will appear here once approved stores go live.",
    },
    {
      label: "Active listings",
      value: "0",
      hint: "Products will appear here as soon as approved listings are published.",
    },
    {
      label: "Trust rating",
      value: "0.0",
      hint: "Trust signals will appear here once the first reviews land.",
    },
  ],
  categories: [],
  brands: [],
  vendors: [],
  products: [],
  collections: [],
  campaigns: [],
  reviews: [],
};

function localDemoFallbackEnabled() {
  return process.env.NODE_ENV !== "production" && getOptionalEnv("MARKETPLACE_ALLOW_DEMO_FALLBACK") === "1";
}

function buildKpis(input: Pick<MarketplaceHomeData, "vendors" | "products" | "reviews">) {
  const reviewAverage = input.reviews.length
    ? input.reviews.reduce((sum, review) => sum + review.rating, 0) / input.reviews.length
    : 0;

  return [
    {
      label: "Verified stores",
      value: String(input.vendors.length),
      hint: "Curated sellers and HenryCo-owned inventory with clearer accountability.",
    },
    {
      label: "Active listings",
      value: String(input.products.length),
      hint: "Approved listings surfaced with delivery, trust, and ownership clarity.",
    },
    {
      label: "Trust rating",
      value: reviewAverage.toFixed(1),
      hint: "Marketplace review quality and seller reliability are surfaced before checkout.",
    },
  ];
}

function getFallbackSnapshot() {
  return localDemoFallbackEnabled() ? demoHomeData : emptyHomeData;
}

function filterValue(value: string) {
  return `"${value.replace(/"/g, '\\"')}"`;
}

function applyIdentityScope<T>(
  query: T,
  viewer: MarketplaceViewerContext,
  userColumn: string,
  emailColumn = "normalized_email"
) : T {
  const scopedQuery = query as IdentityScopeOps<T>;
  if (!viewer.user && !viewer.normalizedEmail) return query;
  if (viewer.user?.id && viewer.normalizedEmail) {
    return scopedQuery.or(
      `${userColumn}.eq.${filterValue(viewer.user.id)},${emailColumn}.eq.${filterValue(viewer.normalizedEmail)}`
    );
  }
  if (viewer.user?.id) {
    return scopedQuery.eq(userColumn, viewer.user.id);
  }
  return scopedQuery.eq(emailColumn, viewer.normalizedEmail);
}

function buildPlaceholderVendor(scopeId?: string | null): MarketplaceVendor {
  return {
    id: scopeId || "vendor-pending",
    slug: "vendor-onboarding",
    name: "Vendor onboarding",
    description:
      "This vendor account is approved for setup but has not completed the storefront profile yet.",
    status: "approved",
    verificationLevel: "silver",
    trustScore: 0,
    responseSlaHours: 24,
    fulfillmentRate: 0,
    disputeRate: 0,
    reviewScore: 0,
    followersCount: 0,
    accent: "#B89656",
    heroImage:
      "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1200&q=80",
    badges: ["Setup in progress"],
    ownerType: "vendor",
    supportEmail: "marketplace@henrycogroup.com",
    supportPhone: "+2349133957084",
  };
}

async function loadDatabaseSnapshot(): Promise<{ snapshot: Snapshot | null; issue: string | null }> {
  try {
    const admin = createAdminSupabase();
    const [categoriesRes, brandsRes, vendorsRes, productsRes, mediaRes, collectionsRes, collectionItemsRes, campaignsRes, reviewsRes] =
      await Promise.all([
        admin.from("marketplace_categories").select("*").order("sort_order", { ascending: true }),
        admin.from("marketplace_brands").select("*").order("name", { ascending: true }),
        admin.from("marketplace_vendors").select("*").eq("status", "approved").order("name", { ascending: true }),
        admin
          .from("marketplace_products")
          .select("*")
          .eq("approval_status", "approved")
          .order("featured", { ascending: false })
          .order("updated_at", { ascending: false }),
        admin.from("marketplace_product_media").select("*").order("sort_order", { ascending: true }),
        admin.from("marketplace_collections").select("*").order("updated_at", { ascending: false }),
        admin.from("marketplace_collection_items").select("*").order("sort_order", { ascending: true }),
        admin.from("marketplace_campaigns").select("*").eq("status", "active").order("updated_at", { ascending: false }),
        admin.from("marketplace_reviews").select("*").eq("status", "published").order("created_at", { ascending: false }),
      ]);

    if (
      categoriesRes.error ||
      brandsRes.error ||
      vendorsRes.error ||
      productsRes.error ||
      mediaRes.error ||
      collectionsRes.error ||
      collectionItemsRes.error ||
      campaignsRes.error ||
      reviewsRes.error
    ) {
      return {
        snapshot: null,
        issue:
          [
            categoriesRes.error?.message,
            brandsRes.error?.message,
            vendorsRes.error?.message,
            productsRes.error?.message,
            mediaRes.error?.message,
            collectionsRes.error?.message,
            collectionItemsRes.error?.message,
            campaignsRes.error?.message,
            reviewsRes.error?.message,
          ]
            .filter(Boolean)
            .join(" | ") || "Marketplace catalog tables are unavailable.",
      };
    }

    const categoryRows = categoriesRes.data ?? [];
    const brandRows = brandsRes.data ?? [];
    const vendorRows = vendorsRes.data ?? [];
    const productRows = productsRes.data ?? [];
    const mediaRows = mediaRes.data ?? [];
    const collectionRows = collectionsRes.data ?? [];
    const collectionItemRows = collectionItemsRes.data ?? [];
    const campaignRows = campaignsRes.data ?? [];
    const reviewRows = reviewsRes.data ?? [];

    const categories: MarketplaceCategory[] = categoryRows.map((row: Record<string, unknown>) => ({
      id: String(row.id),
      slug: String(row.slug),
      name: String(row.name),
      description: String(row.description || ""),
      hero: String(row.hero_copy || row.description || ""),
      featured: Boolean(row.is_featured),
      productCount: Number(row.product_count || 0),
      filterPresets: Array.isArray(row.filter_presets) ? row.filter_presets.map(String) : [],
      trustNotes: Array.isArray(row.trust_notes) ? row.trust_notes.map(String) : [],
    }));

    const brands: MarketplaceBrand[] = brandRows.map((row: Record<string, unknown>) => ({
      id: String(row.id),
      slug: String(row.slug),
      name: String(row.name),
      description: String(row.description || ""),
      accent: String(row.accent || "#B2863B"),
      logoUrl: row.logo_url ? String(row.logo_url) : null,
    }));

    const vendors: MarketplaceVendor[] = vendorRows.map((row: Record<string, unknown>) => ({
      id: String(row.id),
      slug: String(row.slug),
      name: String(row.name),
      description: String(row.description || ""),
      status: String(row.status || "approved") as MarketplaceVendor["status"],
      verificationLevel: String(row.verification_level || "gold") as MarketplaceVendor["verificationLevel"],
      trustScore: Number(row.trust_score || 0),
      responseSlaHours: Number(row.response_sla_hours || 0),
      fulfillmentRate: Number(row.fulfillment_rate || 0),
      disputeRate: Number(row.dispute_rate || 0),
      reviewScore: Number(row.review_score || 0),
      followersCount: Number(row.followers_count || 0),
      accent: String(row.accent || "#B2863B"),
      heroImage: String(row.hero_image_url || ""),
      badges: Array.isArray(row.badges) ? row.badges.map(String) : [],
      ownerType: String(row.owner_type || "vendor") as MarketplaceVendor["ownerType"],
      supportEmail: String(row.support_email || "marketplace@henrycogroup.com"),
      supportPhone: String(row.support_phone || "+2349133957084"),
    }));

    const categoryMap = new Map(categories.map((item) => [item.id, item]));
    const brandMap = new Map(brands.map((item) => [item.id, item]));
    const vendorMap = new Map(vendors.map((item) => [item.id, item]));
    const mediaByProduct = new Map<string, string[]>();

    for (const row of mediaRows as Array<Record<string, unknown>>) {
      const key = String(row.product_id);
      const existing = mediaByProduct.get(key) ?? [];
      if (row.url) existing.push(String(row.url));
      mediaByProduct.set(key, existing);
    }

    const products: MarketplaceProduct[] = productRows.map((row: Record<string, unknown>) => ({
      id: String(row.id),
      slug: String(row.slug),
      title: String(row.title),
      summary: String(row.summary || ""),
      description: String(row.description || ""),
      categorySlug: categoryMap.get(String(row.category_id))?.slug || "uncategorized",
      brandSlug: brandMap.get(String(row.brand_id))?.slug || null,
      vendorSlug: vendorMap.get(String(row.vendor_id))?.slug || null,
      inventoryOwnerType: String(row.inventory_owner_type || "vendor") as MarketplaceProduct["inventoryOwnerType"],
      basePrice: Number(row.base_price || 0),
      compareAtPrice: row.compare_at_price == null ? null : Number(row.compare_at_price),
      currency: String(row.currency || "NGN"),
      stock: Number(row.total_stock || 0),
      sku: String(row.sku || ""),
      rating: Number(row.rating || 0),
      reviewCount: Number(row.review_count || 0),
      featured: Boolean(row.featured),
      approvalStatus: String(row.approval_status || "approved") as MarketplaceProduct["approvalStatus"],
      trustBadges: Array.isArray(row.trust_badges) ? row.trust_badges.map(String) : [],
      gallery: mediaByProduct.get(String(row.id)) ?? [],
      specifications:
        row.specifications && typeof row.specifications === "object"
          ? (row.specifications as Record<string, string>)
          : {},
      filterData:
        row.filter_data && typeof row.filter_data === "object"
          ? (row.filter_data as Record<string, string | string[] | boolean>)
          : {},
      deliveryNote: String(row.delivery_note || ""),
      leadTime: String(row.lead_time || ""),
      codEligible: Boolean(row.cod_eligible),
    }));

    const productMap = new Map(products.map((item) => [item.id, item]));
    const collectionProductMap = new Map<string, string[]>();

    for (const row of collectionItemRows as Array<Record<string, unknown>>) {
      const key = String(row.collection_id);
      const existing = collectionProductMap.get(key) ?? [];
      const slug = productMap.get(String(row.product_id))?.slug;
      if (slug) existing.push(slug);
      collectionProductMap.set(key, existing);
    }

    const collections: MarketplaceCollection[] = collectionRows.map((row: Record<string, unknown>) => ({
      id: String(row.id),
      slug: String(row.slug),
      title: String(row.title),
      description: String(row.description || ""),
      kicker: String(row.kicker || "Editorial Collection"),
      productSlugs: collectionProductMap.get(String(row.id)) ?? [],
      highlight: String(row.highlight || ""),
    }));

    const campaigns: MarketplaceCampaign[] = campaignRows.map((row: Record<string, unknown>) => ({
      id: String(row.id),
      slug: String(row.slug),
      title: String(row.title),
      description: String(row.description || ""),
      surface: String(row.surface || "hero") as MarketplaceCampaign["surface"],
      accent: String(row.accent || "#B2863B"),
      ctaLabel: String(row.cta_label || "Explore"),
      ctaHref: String(row.cta_href || "/"),
      countdown: row.countdown_text ? String(row.countdown_text) : null,
    }));

    const reviews: MarketplaceReview[] = reviewRows.map((row: Record<string, unknown>) => ({
      id: String(row.id),
      productSlug: productMap.get(String(row.product_id))?.slug || String(row.product_id || "product"),
      vendorSlug: vendorMap.get(String(row.vendor_id))?.slug || String(row.vendor_id || "vendor"),
      buyerName: String(row.buyer_name || "Verified buyer"),
      rating: Number(row.rating || 0),
      title: String(row.title || ""),
      body: String(row.body || ""),
      verifiedPurchase: Boolean(row.is_verified_purchase),
      status: String(row.status || "published") as MarketplaceReview["status"],
      createdAt: String(row.created_at || new Date().toISOString()),
    }));

    const snapshot = {
      kpis: buildKpis({ vendors, products, reviews }),
      categories,
      brands,
      vendors,
      products,
      collections,
      campaigns,
      reviews,
    } satisfies Snapshot;

    return {
      snapshot,
      issue:
        snapshot.categories.length === 0 && snapshot.products.length === 0 && snapshot.vendors.length === 0
          ? "Marketplace is connected, but no approved catalog is live yet."
          : null,
    };
  } catch (error) {
    return {
      snapshot: null,
      issue: error instanceof Error ? error.message : "Marketplace catalog failed to load.",
    };
  }
}

export async function getMarketplaceHomeData(): Promise<Snapshot> {
  const { snapshot } = await loadDatabaseSnapshot();
  return snapshot ?? getFallbackSnapshot();
}

export async function getMarketplaceReadiness() {
  const { snapshot, issue } = await loadDatabaseSnapshot();
  return {
    schemaReady: Boolean(snapshot),
    issue,
  };
}

export async function getMarketplaceProductBySlug(slug: string) {
  const snapshot = await getMarketplaceHomeData();
  const product = snapshot.products.find((item) => item.slug === slug) ?? null;
  if (!product) return null;

  return {
    product,
    vendor: snapshot.vendors.find((item) => item.slug === product.vendorSlug) ?? null,
    brand: snapshot.brands.find((item) => item.slug === product.brandSlug) ?? null,
    category: snapshot.categories.find((item) => item.slug === product.categorySlug) ?? null,
    related: snapshot.products.filter((item) => item.categorySlug === product.categorySlug && item.slug !== slug).slice(0, 4),
    reviews: snapshot.reviews.filter((item) => item.productSlug === slug),
  };
}

export async function getMarketplaceVendorBySlug(slug: string) {
  const snapshot = await getMarketplaceHomeData();
  const vendor = snapshot.vendors.find((item) => item.slug === slug) ?? null;
  if (!vendor) return null;
  return {
    vendor,
    products: snapshot.products.filter((item) => item.vendorSlug === slug),
    reviews: snapshot.reviews.filter((item) => item.vendorSlug === slug),
  };
}

export async function getMarketplaceCollectionBySlug(slug: string) {
  const snapshot = await getMarketplaceHomeData();
  const collection = snapshot.collections.find((item) => item.slug === slug) ?? null;
  if (!collection) return null;
  return {
    collection,
    products: collection.productSlugs
      .map((productSlug) => snapshot.products.find((item) => item.slug === productSlug) ?? null)
      .filter(Boolean) as MarketplaceProduct[],
  };
}

export async function searchMarketplace(query: URLSearchParams | Record<string, string | string[] | undefined>) {
  const snapshot = await getMarketplaceHomeData();
  const getValue = (key: string) =>
    query instanceof URLSearchParams
      ? query.get(key)
      : Array.isArray(query[key])
      ? query[key][0]
      : query[key];

  const search = String(getValue("q") || "").trim().toLowerCase();
  const category = String(getValue("category") || "").trim().toLowerCase();
  const brand = String(getValue("brand") || "").trim().toLowerCase();
  const verifiedOnly = String(getValue("verified") || "") === "1";
  const codOnly = String(getValue("cod") || "") === "1";

  return snapshot.products.filter((product) => {
    if (category && product.categorySlug !== category) return false;
    if (brand && product.brandSlug !== brand) return false;
    if (verifiedOnly) {
      const vendor = snapshot.vendors.find((item) => item.slug === product.vendorSlug);
      if (!vendor || vendor.verificationLevel === "bronze") return false;
    }
    if (codOnly && !product.codEligible) return false;
    if (!search) return true;

    return [product.title, product.summary, product.description, product.sku]
      .join(" ")
      .toLowerCase()
      .includes(search);
  });
}

export async function getCartPreview() {
  const viewer = await getMarketplaceViewer();
  const cookieStore = await cookies();
  const token = cookieStore.get("marketplace_cart_token")?.value || null;

  try {
    const admin = createAdminSupabase();
    const cartQuery = viewer.user
      ? admin
          .from("marketplace_carts")
          .select("id")
          .eq("status", "active")
          .eq("user_id", viewer.user.id)
          .maybeSingle()
      : token
      ? admin
          .from("marketplace_carts")
          .select("id")
          .eq("status", "active")
          .eq("session_token", token)
          .maybeSingle()
      : null;

    if (!cartQuery) {
      return {
        items: [] as MarketplaceCartItem[],
        subtotal: 0,
        token,
      };
    }

    const { data: cart, error: cartError } = await cartQuery;
    if (cartError || !cart?.id) {
      throw cartError ?? new Error("Cart not found");
    }

    const { data: rows, error } = await admin
      .from("marketplace_cart_items")
      .select("id, quantity, price, compare_at_price, product_id")
      .eq("cart_id", cart.id)
      .order("updated_at", { ascending: false });

    if (error) throw error;

    const snapshot = await getMarketplaceHomeData();
    const items = (rows ?? []).map((row: Record<string, unknown>) => {
      const product = snapshot.products.find((item) => item.id === String(row.product_id));
      return {
        id: String(row.id),
        productSlug: product?.slug || String(row.product_id || "product"),
        quantity: Number(row.quantity || 1),
        price: Number(row.price || 0),
        compareAtPrice: row.compare_at_price == null ? null : Number(row.compare_at_price),
        vendorSlug: product?.vendorSlug || null,
      } satisfies MarketplaceCartItem;
    });

    return {
      items,
      subtotal: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
      token,
    };
  } catch {
    return {
      items: [] as MarketplaceCartItem[],
      subtotal: 0,
      token,
      issue: "Cart data is unavailable right now.",
    };
  }
}

export async function getMarketplaceShellState(): Promise<MarketplaceShellState> {
  const [viewer, cart, snapshot, readiness] = await Promise.all([
    getMarketplaceViewer(),
    getCartPreview(),
    getMarketplaceHomeData(),
    getMarketplaceReadiness(),
  ]);

  const productBySlug = new Map(snapshot.products.map((item) => [item.slug, item]));
  const vendorBySlug = new Map(snapshot.vendors.map((item) => [item.slug, item]));

  const shellItems: MarketplaceShellCartItem[] = cart.items.map((item) => {
    const product = productBySlug.get(item.productSlug);
    const vendor = product?.vendorSlug ? vendorBySlug.get(product.vendorSlug) ?? null : null;

    return {
      id: item.id,
      productSlug: item.productSlug,
      title: product?.title || item.productSlug.replace(/-/g, " "),
      vendorSlug: product?.vendorSlug || item.vendorSlug,
      vendorName: vendor?.name || null,
      quantity: item.quantity,
      price: item.price,
      compareAtPrice: item.compareAtPrice,
      currency: product?.currency || "NGN",
      image: product?.gallery[0] || null,
      trustBadges: product?.trustBadges ?? [],
      inventoryOwnerType: product?.inventoryOwnerType || "vendor",
      deliveryNote: product?.deliveryNote || "Delivery timing will appear once the item is fully loaded.",
    };
  });

  const baseShell: MarketplaceShellState = {
    schemaReady: readiness.schemaReady,
    issue: readiness.issue,
    viewer: {
      signedIn: Boolean(viewer.user),
      userId: viewer.user?.id ?? null,
      firstName: viewer.user?.fullName ? viewer.user.fullName.split(" ")[0] : null,
      fullName: viewer.user?.fullName ?? null,
      email: viewer.user?.email ?? null,
      avatarUrl: viewer.user?.avatarUrl ?? null,
      roles: viewer.roles,
      canApplyToSell: Boolean(viewer.user),
      canOpenVendorWorkspace: viewer.roles.includes("vendor"),
    },
    cart: {
      count: shellItems.reduce((sum, item) => sum + item.quantity, 0),
      subtotal: cart.subtotal,
      items: shellItems,
    },
    wishlistSlugs: [],
    followedVendorSlugs: [],
    unreadNotificationCount: 0,
    sellerApplicationStatus: null,
  };

  if (!viewer.user) {
    return baseShell;
  }

  try {
    const admin = createAdminSupabase();
    const latestApplicationQuery = applyIdentityScope(
      admin
        .from("marketplace_vendor_applications")
        .select("status")
        .order("created_at", { ascending: false })
        .limit(1),
      viewer,
      "user_id"
    ).maybeSingle();

    const [wishlistRes, followsRes, notificationsRes, applicationRes] = await Promise.all([
      applyIdentityScope(admin.from("marketplace_wishlists").select("product_id"), viewer, "user_id"),
      applyIdentityScope(admin.from("marketplace_vendor_follows").select("vendor_id"), viewer, "user_id"),
      applyIdentityScope(
        admin.from("marketplace_user_notifications").select("id", { count: "exact", head: true }).is("read_at", null),
        viewer,
        "user_id"
      ),
      latestApplicationQuery,
    ]);

    if (wishlistRes.error || followsRes.error || notificationsRes.error) {
      return {
        ...baseShell,
        issue: baseShell.issue || "Buyer shell state is partially unavailable.",
      };
    }

    const productIds = new Set((wishlistRes.data ?? []).map((row: Record<string, unknown>) => String(row.product_id)));
    const vendorIds = new Set((followsRes.data ?? []).map((row: Record<string, unknown>) => String(row.vendor_id)));

    return {
      ...baseShell,
      wishlistSlugs: snapshot.products.filter((product) => productIds.has(product.id)).map((product) => product.slug),
      followedVendorSlugs: snapshot.vendors.filter((vendor) => vendorIds.has(vendor.id)).map((vendor) => vendor.slug),
      unreadNotificationCount: notificationsRes.count ?? 0,
      sellerApplicationStatus: applicationRes.data?.status
        ? (String(applicationRes.data.status) as MarketplaceVendorApplication["status"])
        : null,
    };
  } catch {
    return {
      ...baseShell,
      issue: baseShell.issue || "Buyer shell state is partially unavailable.",
    };
  }
}

export async function getBuyerDashboardData() {
  const viewer = await getMarketplaceViewer();
  if (!viewer.user) {
    return {
      viewer,
      addresses: [] as MarketplaceAddress[],
      orders: [] as MarketplaceOrder[],
      notifications: [] as MarketplaceNotification[],
      disputes: [] as MarketplaceDispute[],
      payments: [] as MarketplacePaymentRecord[],
      reviews: [] as MarketplaceReview[],
      wishlist: [] as MarketplaceProduct[],
      follows: [] as MarketplaceVendor[],
      supportThreads: [] as MarketplaceSupportThread[],
      application: null as MarketplaceVendorApplication | null,
    };
  }

  try {
    const admin = createAdminSupabase();
    const latestApplicationQuery = applyIdentityScope(
      admin
        .from("marketplace_vendor_applications")
        .select("*")
        .order("submitted_at", { ascending: false })
        .limit(1),
      viewer,
      "user_id"
    ).maybeSingle();

    const [addressesRes, ordersRes, orderGroupsRes, orderItemsRes, paymentsRes, disputesRes, notificationsRes, applicationRes, wishlistRes, followsRes, reviewsRes, supportThreadsRes] =
      await Promise.all([
        applyIdentityScope(
          admin.from("marketplace_addresses").select("*").order("is_default", { ascending: false }),
          viewer,
          "user_id"
        ),
        applyIdentityScope(
          admin.from("marketplace_orders").select("*").order("placed_at", { ascending: false }),
          viewer,
          "user_id"
        ),
        admin.from("marketplace_order_groups").select("*").order("created_at", { ascending: false }),
        admin.from("marketplace_order_items").select("*").order("created_at", { ascending: false }),
        admin.from("marketplace_payment_records").select("*").order("created_at", { ascending: false }),
        applyIdentityScope(
          admin.from("marketplace_disputes").select("*").order("updated_at", { ascending: false }),
          viewer,
          "opened_by_user_id"
        ),
        applyIdentityScope(
          admin.from("marketplace_user_notifications").select("*").order("created_at", { ascending: false }),
          viewer,
          "user_id"
        ),
        latestApplicationQuery,
        applyIdentityScope(admin.from("marketplace_wishlists").select("product_id"), viewer, "user_id"),
        applyIdentityScope(admin.from("marketplace_vendor_follows").select("vendor_id"), viewer, "user_id"),
        applyIdentityScope(
          admin.from("marketplace_reviews").select("*").order("created_at", { ascending: false }),
          viewer,
          "user_id"
        ),
        applyIdentityScope(
          admin.from("marketplace_support_threads").select("*").order("updated_at", { ascending: false }),
          viewer,
          "user_id"
        ),
      ]);

    if (
      addressesRes.error ||
      ordersRes.error ||
      orderGroupsRes.error ||
      orderItemsRes.error ||
      paymentsRes.error ||
      disputesRes.error ||
      notificationsRes.error ||
      wishlistRes.error ||
      followsRes.error ||
      reviewsRes.error ||
      supportThreadsRes.error
    ) {
      throw new Error("Marketplace buyer tables unavailable.");
    }

    const snapshot = await getMarketplaceHomeData();
    const vendorById = new Map(snapshot.vendors.map((item) => [item.id, item]));
    const productById = new Map(snapshot.products.map((item) => [item.id, item]));

    const orders = (ordersRes.data ?? []).map((row: Record<string, unknown>) => {
      const groups = (orderGroupsRes.data ?? [])
        .filter((group: Record<string, unknown>) => String(group.order_id) === String(row.id))
        .map((group: Record<string, unknown>) => ({
          id: String(group.id),
          vendorSlug: vendorById.get(String(group.vendor_id))?.slug || null,
          ownerType: String(group.owner_type || "vendor") as MarketplaceOrder["groups"][number]["ownerType"],
          fulfillmentStatus: String(group.fulfillment_status || "awaiting_acceptance") as MarketplaceOrder["groups"][number]["fulfillmentStatus"],
          paymentStatus: String(group.payment_status || "pending") as MarketplaceOrder["groups"][number]["paymentStatus"],
          payoutStatus: String(group.payout_status || "eligible") as MarketplaceOrder["groups"][number]["payoutStatus"],
          subtotal: Number(group.subtotal || 0),
          commissionAmount: Number(group.commission_amount || 0),
          netVendorAmount: Number(group.net_vendor_amount || 0),
          shipmentCode: group.shipment_code ? String(group.shipment_code) : null,
          shipmentCarrier: group.shipment_carrier ? String(group.shipment_carrier) : null,
          shipmentTrackingCode: group.shipment_tracking_code ? String(group.shipment_tracking_code) : null,
          deliveredAt: group.delivered_at ? String(group.delivered_at) : null,
        }));

      const items = (orderItemsRes.data ?? [])
        .filter((item: Record<string, unknown>) =>
          groups.some((group: MarketplaceOrder["groups"][number]) => group.id === String(item.order_group_id))
        )
        .map((item: Record<string, unknown>) => ({
          id: String(item.id),
          productSlug: productById.get(String(item.product_id))?.slug || String(item.product_id || "product"),
          quantity: Number(item.quantity || 1),
          unitPrice: Number(item.unit_price || 0),
          lineTotal: Number(item.line_total || 0),
          vendorSlug: vendorById.get(String(item.vendor_id))?.slug || null,
        }));

      return {
        id: String(row.id),
        orderNo: String(row.order_no),
        status: String(row.status || "placed") as MarketplaceOrder["status"],
        paymentStatus: String(row.payment_status || "pending") as MarketplaceOrder["paymentStatus"],
        currency: String(row.currency || "NGN"),
        subtotal: Number(row.subtotal || 0),
        shippingTotal: Number(row.shipping_total || 0),
        discountTotal: Number(row.discount_total || 0),
        grandTotal: Number(row.grand_total || 0),
        placedAt: String(row.placed_at || row.created_at || new Date().toISOString()),
        buyerName: String(row.buyer_name || viewer.user?.fullName || "Buyer"),
        buyerEmail: String(row.buyer_email || viewer.user?.email || ""),
        shippingCity: String(row.shipping_city || ""),
        shippingRegion: String(row.shipping_region || ""),
        timeline: Array.isArray(row.timeline) ? row.timeline.map(String) : [],
        groups,
        items,
      } satisfies MarketplaceOrder;
    });

    const payments = (paymentsRes.data ?? []).map((row: Record<string, unknown>) => ({
      id: String(row.id),
      orderNo: String(row.order_no || ""),
      method: String(row.method || "bank_transfer") as MarketplacePaymentRecord["method"],
      provider: String(row.provider || "manual") as MarketplacePaymentRecord["provider"],
      status: String(row.status || "pending") as MarketplacePaymentRecord["status"],
      amount: Number(row.amount || 0),
      reference: String(row.reference || ""),
      verifiedAt: row.verified_at ? String(row.verified_at) : null,
    }));

    const disputes = (disputesRes.data ?? []).map((row: Record<string, unknown>) => ({
      id: String(row.id),
      disputeNo: String(row.dispute_no || ""),
      orderNo: String(row.order_no || ""),
      vendorSlug: vendorById.get(String(row.vendor_id))?.slug || null,
      status: String(row.status || "open") as MarketplaceDispute["status"],
      reason: String(row.reason || ""),
      resolutionType: row.resolution_type ? String(row.resolution_type) : null,
      refundAmount: row.refund_amount == null ? null : Number(row.refund_amount),
      updatedAt: String(row.updated_at || new Date().toISOString()),
    }));

    const notifications = (notificationsRes.data ?? []).map((row: Record<string, unknown>) => ({
      id: String(row.id),
      title: String(row.title || ""),
      body: String(row.body || ""),
      channel: String(row.channel || "system") as MarketplaceNotification["channel"],
      createdAt: String(row.created_at || new Date().toISOString()),
      readAt: row.read_at ? String(row.read_at) : null,
    }));

    const addresses = (addressesRes.data ?? []).map((row: Record<string, unknown>) => ({
      id: String(row.id),
      label: String(row.label || "Address"),
      recipient: String(row.recipient_name || row.recipient || ""),
      phone: String(row.phone || ""),
      line1: String(row.line1 || ""),
      line2: row.line2 ? String(row.line2) : null,
      city: String(row.city || ""),
      region: String(row.region || ""),
      country: String(row.country || "Nigeria"),
      isDefault: Boolean(row.is_default),
    }));

    const reviews = (reviewsRes.data ?? []).map((row: Record<string, unknown>) => ({
      id: String(row.id),
      productSlug: productById.get(String(row.product_id))?.slug || String(row.product_id || "product"),
      vendorSlug: vendorById.get(String(row.vendor_id))?.slug || String(row.vendor_id || "vendor"),
      buyerName: String(row.buyer_name || viewer.user?.fullName || "Buyer"),
      rating: Number(row.rating || 0),
      title: String(row.title || ""),
      body: String(row.body || ""),
      verifiedPurchase: Boolean(row.is_verified_purchase),
      status: String(row.status || "pending") as MarketplaceReview["status"],
      createdAt: String(row.created_at || new Date().toISOString()),
    }));

    const supportThreads = (supportThreadsRes.data ?? []).map((row: Record<string, unknown>) => ({
      id: String(row.id),
      subject: String(row.subject || "Support thread"),
      status: String(row.status || "open"),
      channel: String(row.channel || "web"),
      lastMessage: row.last_message ? String(row.last_message) : null,
      createdAt: String(row.created_at || new Date().toISOString()),
      updatedAt: String(row.updated_at || row.created_at || new Date().toISOString()),
    }));

    const wishlistIds = new Set((wishlistRes.data ?? []).map((row: Record<string, unknown>) => String(row.product_id)));
    const followIds = new Set((followsRes.data ?? []).map((row: Record<string, unknown>) => String(row.vendor_id)));

    return {
      viewer,
      addresses,
      orders,
      notifications,
      disputes,
      payments,
      reviews,
      wishlist: snapshot.products.filter((item) => wishlistIds.has(item.id)),
      follows: snapshot.vendors.filter((item) => followIds.has(item.id)),
      supportThreads,
      application: applicationRes.data
        ? ({
            id: String(applicationRes.data.id),
            storeName: String(applicationRes.data.store_name || ""),
            slug: String(applicationRes.data.proposed_store_slug || ""),
            legalName: String(applicationRes.data.legal_name || ""),
            phone: applicationRes.data.contact_phone ? String(applicationRes.data.contact_phone) : null,
            categoryFocus: String(applicationRes.data.category_focus || ""),
            story: String(applicationRes.data.story || ""),
            status: String(applicationRes.data.status || "submitted") as MarketplaceVendorApplication["status"],
            progressStep: String(applicationRes.data.progress_step || "start"),
            submittedAt: String(applicationRes.data.submitted_at || new Date().toISOString()),
            reviewNote: applicationRes.data.review_note ? String(applicationRes.data.review_note) : null,
            documents:
              applicationRes.data.documents_json && typeof applicationRes.data.documents_json === "object"
                ? (applicationRes.data.documents_json as Record<string, string>)
                : {},
            draftPayload:
              applicationRes.data.draft_payload && typeof applicationRes.data.draft_payload === "object"
                ? (applicationRes.data.draft_payload as Record<string, unknown>)
                : {},
            agreementAcceptedAt: applicationRes.data.agreement_accepted_at
              ? String(applicationRes.data.agreement_accepted_at)
              : null,
          } satisfies MarketplaceVendorApplication)
        : null,
    };
  } catch {
    return {
      viewer,
      addresses: [] as MarketplaceAddress[],
      orders: [] as MarketplaceOrder[],
      notifications: [] as MarketplaceNotification[],
      disputes: [] as MarketplaceDispute[],
      payments: [] as MarketplacePaymentRecord[],
      reviews: [] as MarketplaceReview[],
      wishlist: [] as MarketplaceProduct[],
      follows: [] as MarketplaceVendor[],
      supportThreads: [],
      application: null as MarketplaceVendorApplication | null,
      issue: "Buyer account data is unavailable right now.",
    };
  }
}

export function toMarketplaceOrderFeed(orders: MarketplaceOrder[]): MarketplaceOrderFeedItem[] {
  return orders.map((order) => {
    const stalled = ["placed", "awaiting_payment", "paid_held", "processing", "awaiting_auto_release"].includes(order.status);
    const headline =
      order.status === "payout_released"
        ? `${order.orderNo} has completed HenryCo payout settlement`
        : order.status === "payout_frozen"
          ? `${order.orderNo} is under trust and payout review`
          : order.paymentStatus === "verified"
            ? `${order.orderNo} is moving through fulfillment and escrow`
            : stalled
              ? `${order.orderNo} needs the next protected action`
              : `${order.orderNo} is live in the order timeline`;

    const latestGroupPayoutState =
      order.groups.find((group) => group.payoutStatus && group.payoutStatus !== "paid")?.payoutStatus || null;

    const detailParts = [
      `Payment ${titleCaseMarketplaceValue(order.paymentStatus.replace(/_/g, " "))}`,
      latestGroupPayoutState ? `Payout ${titleCaseMarketplaceValue(latestGroupPayoutState.replace(/_/g, " "))}` : null,
      `${order.groups.length} delivery segment${order.groups.length === 1 ? "" : "s"}`,
      order.timeline[order.timeline.length - 1] || `Status ${titleCaseMarketplaceValue(order.status.replace(/_/g, " "))}`,
    ].filter(Boolean) as string[];

    return {
      id: order.id,
      orderNo: order.orderNo,
      status: order.status,
      paymentStatus: order.paymentStatus,
      headline,
      detail: detailParts.join(" · "),
      createdAt: order.placedAt,
    } satisfies MarketplaceOrderFeedItem;
  });
}

export async function getVendorWorkspaceData() {
  const viewer = await getMarketplaceViewer();
  const snapshot = await getMarketplaceHomeData();
  const vendorMembership = viewer.memberships.find((membership) => membership.role === "vendor");
  const vendor =
    snapshot.vendors.find((item) => item.id === vendorMembership?.scopeId) ??
    buildPlaceholderVendor(vendorMembership?.scopeId);

  try {
    const admin = createAdminSupabase();
    const [productsRes, payoutsRes, disputesRes, groupsRes, ordersRes, moderationRes] = await Promise.all([
      admin.from("marketplace_products").select("*").eq("vendor_id", vendor.id).order("updated_at", { ascending: false }),
      admin.from("marketplace_payout_requests").select("*").eq("vendor_id", vendor.id).order("created_at", { ascending: false }),
      admin.from("marketplace_disputes").select("*").eq("vendor_id", vendor.id).order("updated_at", { ascending: false }),
      admin.from("marketplace_order_groups").select("*").eq("vendor_id", vendor.id).order("created_at", { ascending: false }),
      admin.from("marketplace_orders").select("*").order("placed_at", { ascending: false }),
      admin.from("marketplace_moderation_cases").select("id", { count: "exact", head: true }).eq("subject_type", "product"),
    ]);

    if (productsRes.error || payoutsRes.error || disputesRes.error || groupsRes.error || ordersRes.error || moderationRes.error) {
      throw new Error("Vendor tables unavailable");
    }

    const ordersById = new Map((ordersRes.data ?? []).map((item: Record<string, unknown>) => [String(item.id), item]));
    const groupRows = (groupsRes.data ?? []) as Array<Record<string, unknown>>;
    const deliveredOrderCount = groupRows.filter((row) => String(row.fulfillment_status || "") === "delivered").length;
    const openDisputeCount = (disputesRes.data ?? []).filter(
      (row: Record<string, unknown>) => String(row.status || "") !== "resolved"
    ).length;
    const trustProfile = deriveSellerTrustProfile({
      vendor,
      deliveredOrderCount,
      openDisputeCount,
      productCount: (productsRes.data ?? []).length,
      moderationIncidents: moderationRes.count ?? 0,
    });
    const balanceSummary = computePayoutBalance({
      groups: groupRows.map((row) => ({
        id: String(row.id),
        payoutStatus: String(row.payout_status || ""),
        netVendorAmount: Number(row.net_vendor_amount || 0),
      })),
    });
    const payoutChecklist = [
      vendor.supportEmail ? "Support email configured." : "Add a support email before the next payout review.",
      vendor.supportPhone ? "Support phone configured." : "Add a support phone for faster dispute handling.",
      trustProfile.tier === "unverified"
        ? "Complete seller verification to reduce reserve windows."
        : `${trustProfile.label} sellers currently auto-release after ${trustProfile.autoReleaseDays} day(s).`,
      openDisputeCount > 0
        ? "Resolve open disputes before requesting more payout volume."
        : "No open disputes are blocking payout readiness.",
    ];

    return {
      viewer,
      vendor,
      trustProfile,
      balanceSummary,
      payoutChecklist,
      products:
        productsRes.data?.map((row: Record<string, unknown>) => ({
          id: String(row.id),
          slug: String(row.slug || "draft-product"),
          title: String(row.title || "Product draft"),
          summary: String(row.summary || ""),
          description: String(row.description || ""),
          categorySlug:
            snapshot.categories.find((category) => category.id === String(row.category_id))?.slug || "uncategorized",
          brandSlug:
            snapshot.brands.find((brand) => brand.id === String(row.brand_id))?.slug || null,
          approvalStatus: String(row.approval_status || "draft") as MarketplaceProduct["approvalStatus"],
          inventoryOwnerType: String(row.inventory_owner_type || "vendor") as MarketplaceProduct["inventoryOwnerType"],
          basePrice: Number(row.base_price || 0),
          compareAtPrice: row.compare_at_price == null ? null : Number(row.compare_at_price),
          currency: String(row.currency || "NGN"),
          stock: Number(row.total_stock || 0),
          sku: String(row.sku || ""),
          rating: Number(row.rating || 0),
          reviewCount: Number(row.review_count || 0),
          featured: Boolean(row.featured),
          trustBadges: Array.isArray(row.trust_badges) ? row.trust_badges.map(String) : [],
          gallery: snapshot.products.find((item) => item.id === String(row.id))?.gallery ?? [],
          specifications:
            row.specifications && typeof row.specifications === "object"
              ? (row.specifications as Record<string, string>)
              : {},
          filterData:
            row.filter_data && typeof row.filter_data === "object"
              ? (row.filter_data as Record<string, string | string[] | boolean>)
              : {},
          deliveryNote: String(row.delivery_note || ""),
          leadTime: String(row.lead_time || ""),
          codEligible: Boolean(row.cod_eligible),
          vendorSlug: vendor.slug,
        })) ?? [],
      payouts:
        payoutsRes.data?.map((row: Record<string, unknown>) => ({
          id: String(row.id),
          reference: String(row.reference || ""),
          vendorSlug: vendor.slug,
          amount: Number(row.amount || 0),
          status: String(row.status || "requested") as MarketplacePayoutRequest["status"],
          requestedAt: String(row.created_at || new Date().toISOString()),
          reviewedAt: row.reviewed_at ? String(row.reviewed_at) : null,
        })) ?? [],
      disputes:
        disputesRes.data?.map((row: Record<string, unknown>) => ({
          id: String(row.id),
          disputeNo: String(row.dispute_no || ""),
          orderNo: String(row.order_no || ""),
          vendorSlug: vendor.slug,
          status: String(row.status || "open") as MarketplaceDispute["status"],
          reason: String(row.reason || ""),
          resolutionType: row.resolution_type ? String(row.resolution_type) : null,
          refundAmount: row.refund_amount == null ? null : Number(row.refund_amount),
          updatedAt: String(row.updated_at || new Date().toISOString()),
        })) ?? [],
      orders:
        groupsRes.data?.map((row: Record<string, unknown>) => {
          const order = ordersById.get(String(row.order_id));
          return {
            id: String(row.id),
            orderNo: String(row.order_no || order?.order_no || ""),
            status: String(order?.status || "placed"),
            fulfillmentStatus: String(row.fulfillment_status || "awaiting_acceptance"),
            paymentStatus: String(row.payment_status || "pending"),
            payoutStatus: String(row.payout_status || "awaiting_payment"),
            subtotal: Number(row.subtotal || 0),
            netVendorAmount: Number(row.net_vendor_amount || 0),
            placedAt: String(order?.placed_at || order?.created_at || new Date().toISOString()),
          };
        }) ?? [],
    };
  } catch {
    return {
      viewer,
      vendor,
      trustProfile: deriveSellerTrustProfile({ vendor }),
      balanceSummary: computePayoutBalance({ groups: [] }),
      payoutChecklist: [] as string[],
      products: [] as MarketplaceProduct[],
      payouts: [] as MarketplacePayoutRequest[],
      disputes: [] as MarketplaceDispute[],
      orders: [] as Array<{
        id: string;
        orderNo: string;
        status: string;
        fulfillmentStatus: string;
        paymentStatus: string;
        payoutStatus: string;
        subtotal: number;
        netVendorAmount: number;
        placedAt: string;
      }>,
      issue: "Vendor workspace data is unavailable right now.",
    };
  }
}

export async function getStaffOverviewData() {
  try {
    const admin = createAdminSupabase();
    const [applicationsRes, productsRes, disputesRes, payoutsRes, ordersRes] = await Promise.all([
      admin.from("marketplace_vendor_applications").select("id, status"),
      admin.from("marketplace_products").select("id, approval_status, total_stock"),
      admin.from("marketplace_disputes").select("id, status"),
      admin.from("marketplace_payout_requests").select("id, status"),
      admin.from("marketplace_orders").select("id, status, payment_status"),
    ]);

    if (applicationsRes.error || productsRes.error || disputesRes.error || payoutsRes.error || ordersRes.error) {
      throw new Error("Staff tables unavailable");
    }

    const products = productsRes.data ?? [];
    const orders = ordersRes.data ?? [];

    return {
      applicationCount: (applicationsRes.data ?? []).length,
      pendingApplications: (applicationsRes.data ?? []).filter((item: Record<string, unknown>) =>
        ["submitted", "under_review", "changes_requested"].includes(String(item.status))
      ).length,
      pendingProducts: products.filter((item: Record<string, unknown>) =>
        ["submitted", "under_review", "changes_requested"].includes(String(item.approval_status))
      ).length,
      lowStockProducts: products.filter((item: Record<string, unknown>) => Number(item.total_stock || 0) <= 5).length,
      openDisputes: (disputesRes.data ?? []).filter((item: Record<string, unknown>) => String(item.status) !== "resolved").length,
      pendingPayouts: (payoutsRes.data ?? []).filter((item: Record<string, unknown>) => String(item.status) === "requested").length,
      stalledOrders: orders.filter((item: Record<string, unknown>) =>
        ["placed", "awaiting_payment", "processing"].includes(String(item.status))
      ).length,
    };
  } catch {
    return {
      applicationCount: 0,
      pendingApplications: 0,
      pendingProducts: 0,
      lowStockProducts: 0,
      openDisputes: 0,
      pendingPayouts: 0,
      stalledOrders: 0,
      issue: "Staff overview data is unavailable right now.",
    };
  }
}

export async function getStaffQueueData() {
  try {
    const admin = createAdminSupabase();
    const [
      applicationsRes,
      productsRes,
      disputesRes,
      payoutsRes,
      ordersRes,
      paymentsRes,
      returnsRes,
      supportThreadsRes,
      notificationsRes,
      auditLogsRes,
    ] = await Promise.all([
      admin.from("marketplace_vendor_applications").select("*").order("submitted_at", { ascending: false }),
      admin.from("marketplace_products").select("*").order("updated_at", { ascending: false }),
      admin.from("marketplace_disputes").select("*").order("updated_at", { ascending: false }),
      admin.from("marketplace_payout_requests").select("*").order("created_at", { ascending: false }),
      admin.from("marketplace_orders").select("*").order("placed_at", { ascending: false }),
      admin.from("marketplace_payment_records").select("*").order("created_at", { ascending: false }),
      admin.from("marketplace_returns").select("*").order("updated_at", { ascending: false }),
      admin.from("marketplace_support_threads").select("*").order("updated_at", { ascending: false }),
      admin.from("marketplace_notification_queue").select("*").order("created_at", { ascending: false }).limit(100),
      admin.from("marketplace_audit_logs").select("*").order("created_at", { ascending: false }).limit(100),
    ]);

    if (
      applicationsRes.error ||
      productsRes.error ||
      disputesRes.error ||
      payoutsRes.error ||
      ordersRes.error ||
      paymentsRes.error ||
      returnsRes.error ||
      supportThreadsRes.error ||
      notificationsRes.error ||
      auditLogsRes.error
    ) {
      throw new Error("Queue tables unavailable");
    }

    return {
      applications: applicationsRes.data ?? [],
      products: productsRes.data ?? [],
      disputes: disputesRes.data ?? [],
      payouts: payoutsRes.data ?? [],
      orders: ordersRes.data ?? [],
      payments: paymentsRes.data ?? [],
      returns: returnsRes.data ?? [],
      supportThreads: supportThreadsRes.data ?? [],
      notifications: notificationsRes.data ?? [],
      auditLogs: auditLogsRes.data ?? [],
    };
  } catch {
    return {
      applications: [] as Array<Record<string, unknown>>,
      products: [] as Array<Record<string, unknown>>,
      disputes: [] as Array<Record<string, unknown>>,
      payouts: [] as Array<Record<string, unknown>>,
      orders: [] as Array<Record<string, unknown>>,
      payments: [] as Array<Record<string, unknown>>,
      returns: [] as Array<Record<string, unknown>>,
      supportThreads: [] as Array<Record<string, unknown>>,
      notifications: [] as Array<Record<string, unknown>>,
      auditLogs: [] as Array<Record<string, unknown>>,
      issue: "Operator queue data is unavailable right now.",
    };
  }
}

export async function getOrderByNumber(orderNo: string) {
  try {
    const admin = createAdminSupabase();
    const [orderRes, groupsRes, itemsRes] = await Promise.all([
      admin.from("marketplace_orders").select("*").eq("order_no", orderNo).maybeSingle(),
      admin.from("marketplace_order_groups").select("*").eq("order_no", orderNo),
      admin.from("marketplace_order_items").select("*").eq("order_no", orderNo),
    ]);

    if (orderRes.error || groupsRes.error || itemsRes.error || !orderRes.data) {
      throw new Error("Order not found");
    }

    const snapshot = await getMarketplaceHomeData();
    const vendorById = new Map(snapshot.vendors.map((item) => [item.id, item]));
    const productById = new Map(snapshot.products.map((item) => [item.id, item]));

    return {
      id: String(orderRes.data.id),
      orderNo: String(orderRes.data.order_no),
      status: String(orderRes.data.status || "placed") as MarketplaceOrder["status"],
      paymentStatus: String(orderRes.data.payment_status || "pending") as MarketplaceOrder["paymentStatus"],
      currency: String(orderRes.data.currency || "NGN"),
      subtotal: Number(orderRes.data.subtotal || 0),
      shippingTotal: Number(orderRes.data.shipping_total || 0),
      discountTotal: Number(orderRes.data.discount_total || 0),
      grandTotal: Number(orderRes.data.grand_total || 0),
      placedAt: String(orderRes.data.placed_at || orderRes.data.created_at || new Date().toISOString()),
      buyerName: String(orderRes.data.buyer_name || "Buyer"),
      buyerEmail: String(orderRes.data.buyer_email || ""),
      shippingCity: String(orderRes.data.shipping_city || ""),
      shippingRegion: String(orderRes.data.shipping_region || ""),
      timeline: Array.isArray(orderRes.data.timeline)
        ? orderRes.data.timeline.map(String)
        : [`Order status: ${titleCaseMarketplaceValue(String(orderRes.data.status || "placed").replace(/_/g, " "))}`],
      groups: (groupsRes.data ?? []).map((group: Record<string, unknown>) => ({
        id: String(group.id),
        vendorSlug: vendorById.get(String(group.vendor_id))?.slug || null,
        ownerType: String(group.owner_type || "vendor") as MarketplaceOrder["groups"][number]["ownerType"],
        fulfillmentStatus: String(group.fulfillment_status || "awaiting_acceptance") as MarketplaceOrder["groups"][number]["fulfillmentStatus"],
        paymentStatus: String(group.payment_status || "pending") as MarketplaceOrder["groups"][number]["paymentStatus"],
        payoutStatus: String(group.payout_status || "awaiting_payment") as MarketplaceOrder["groups"][number]["payoutStatus"],
        subtotal: Number(group.subtotal || 0),
        commissionAmount: Number(group.commission_amount || 0),
        netVendorAmount: Number(group.net_vendor_amount || 0),
        shipmentCode: group.shipment_code ? String(group.shipment_code) : null,
        shipmentCarrier: group.shipment_carrier ? String(group.shipment_carrier) : null,
        shipmentTrackingCode: group.shipment_tracking_code ? String(group.shipment_tracking_code) : null,
        deliveredAt: group.delivered_at ? String(group.delivered_at) : null,
      })),
      items: (itemsRes.data ?? []).map((item: Record<string, unknown>) => ({
        id: String(item.id),
        productSlug: productById.get(String(item.product_id))?.slug || String(item.product_id || "product"),
        quantity: Number(item.quantity || 1),
        unitPrice: Number(item.unit_price || 0),
        lineTotal: Number(item.line_total || 0),
        vendorSlug: vendorById.get(String(item.vendor_id))?.slug || null,
      })),
    } satisfies MarketplaceOrder;
  } catch {
    return null;
  }
}
