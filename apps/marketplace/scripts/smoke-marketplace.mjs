import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const appDir = process.cwd();
const rootDir = path.resolve(appDir, "..", "..");

function loadEnvFile(filepath) {
  if (!fs.existsSync(filepath)) return;
  const content = fs.readFileSync(filepath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    if (!line || line.trim().startsWith("#")) continue;
    const index = line.indexOf("=");
    if (index <= 0) continue;
    const key = line.slice(0, index).trim();
    const raw = line.slice(index + 1).trim();
    if (!key || process.env[key]) continue;
    process.env[key] = raw.replace(/^['"]|['"]$/g, "");
  }
}

loadEnvFile(path.join(rootDir, ".env.local"));
loadEnvFile(path.join(rootDir, ".env.production.vercel"));

const port = Number(process.env.MARKETPLACE_E2E_PORT || 3016);
const defaultBaseUrl =
  process.env.VERCEL_ENV === "production"
    ? "https://marketplace.henrycogroup.com"
    : `http://127.0.0.1:${port}`;
const baseURL =
  process.env.MARKETPLACE_SMOKE_BASE_URL ||
  process.env.MARKETPLACE_E2E_BASE_URL ||
  defaultBaseUrl;

const requiredFiles = [
  "app/(public)/page.tsx",
  "app/(public)/checkout/page.tsx",
  "app/(public)/product/[slug]/page.tsx",
  "app/(public)/store/[slug]/page.tsx",
  "app/(public)/track/[orderNo]/page.tsx",
  "app/account/orders/page.tsx",
  "app/vendor/orders/page.tsx",
  "app/admin/page.tsx",
  "app/support/page.tsx",
  "app/api/marketplace/route.ts",
  "app/api/health/route.ts",
  "app/api/readiness/route.ts",
  "app/api/version/route.ts",
  "app/api/cron/marketplace-automation/route.ts",
  "lib/marketplace/automation.ts",
  "supabase/migrations/20260402180000_marketplace_init.sql",
  "supabase/migrations/20260402180500_marketplace_policies.sql",
  "supabase/migrations/20260402223000_marketplace_events_and_application_state.sql",
  "scripts/seed-marketplace.mjs",
  "scripts/sync-marketplace-division.mjs",
];

const missingFiles = requiredFiles.filter((file) => !fs.existsSync(path.join(appDir, file)));
if (missingFiles.length) {
  console.error("[marketplace:smoke] Missing required files:");
  for (const file of missingFiles) console.error(` - ${file}`);
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  process.exit(missingFiles.length ? 1 : 0);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const tableChecks = [
  "company_divisions",
  "marketplace_role_memberships",
  "marketplace_settings",
  "marketplace_categories",
  "marketplace_brands",
  "marketplace_vendors",
  "marketplace_vendor_applications",
  "marketplace_products",
  "marketplace_product_media",
  "marketplace_product_variants",
  "marketplace_carts",
  "marketplace_cart_items",
  "marketplace_orders",
  "marketplace_order_groups",
  "marketplace_order_items",
  "marketplace_payment_records",
  "marketplace_shipments",
  "marketplace_addresses",
  "marketplace_wishlists",
  "marketplace_vendor_follows",
  "marketplace_recently_viewed",
  "marketplace_user_notifications",
  "marketplace_reviews",
  "marketplace_disputes",
  "marketplace_payout_requests",
  "marketplace_notification_queue",
  "marketplace_events",
  "marketplace_notification_attempts",
  "marketplace_automation_runs",
  "marketplace_user_comm_preferences",
  "marketplace_support_threads",
  "marketplace_support_messages",
];

let hasFailure = missingFiles.length > 0;
const warnings = [];

for (const table of tableChecks) {
  const { error } = await supabase.from(table).select("id").limit(1);
  if (error) {
    console.error(`[marketplace:smoke] Database check failed for ${table}: ${error.message}`);
    hasFailure = true;
  }
}

const { data: division, error: divisionError } = await supabase
  .from("company_divisions")
  .select("slug, primary_url, status")
  .eq("slug", "marketplace")
  .maybeSingle();

if (divisionError || !division) {
  console.error(
    `[marketplace:smoke] Marketplace division missing: ${
      divisionError?.message || "No company_divisions row for slug=marketplace"
    }`
  );
  hasFailure = true;
}

if (!hasFailure) {
  console.log("[marketplace:smoke] File and database checks passed.");
}

function assert(condition, message) {
  if (!condition) {
    console.error(`[marketplace:smoke] ${message}`);
    hasFailure = true;
  }
}

function decodeHtml(value) {
  return String(value || "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function toUrl(pathname) {
  return new URL(pathname, baseURL).toString();
}

async function fetchText(pathname, options = {}) {
  const response = await fetch(toUrl(pathname), {
    redirect: "manual",
    ...options,
  });
  const body = await response.text();
  return { response, body };
}

function extractCookie(response) {
  const raw = response.headers.get("set-cookie");
  if (!raw) return null;
  return raw.split(";")[0];
}

function readRedirectTarget(response, body) {
  const location = response.headers.get("location") || "";
  if (location) return location;

  const metaMatch = body.match(/<meta[^>]+id="__next-page-redirect"[^>]+content="[^"]*url=([^"]+)"/i);
  if (metaMatch?.[1]) return metaMatch[1];

  const digestMatch = body.match(/NEXT_REDIRECT;replace;([^;]+);307;/i);
  if (digestMatch?.[1]) return digestMatch[1];

  return "";
}

function assertSharedAccountRedirect(pathname, expectedPrefix, label) {
  return fetchText(pathname).then(({ response, body }) => {
    const redirectTarget = readRedirectTarget(response, body);
    const redirectLike =
      response.status === 307 ||
      (response.status === 200 &&
        (body.includes("__next-page-redirect") || body.includes("NEXT_REDIRECT;replace;")));

    assert(redirectLike, `${label} redirect returned ${response.status}`);
    assert(
      redirectTarget.startsWith(expectedPrefix),
      `${label} redirect target was not shared account: ${redirectTarget || "missing location"}`
    );
  });
}

async function checkRoute(pathname, needle, label = pathname, options = {}) {
  const { response, body } = await fetchText(pathname, options);
  assert(response.ok, `${label} returned ${response.status}`);
  if (needle) {
    assert(
      decodeHtml(body).includes(needle),
      `${label} did not include expected content: ${needle}`
    );
  }
}

const [{ data: category }, { data: product }, { data: vendor }, { data: order }] = await Promise.all([
  supabase
    .from("marketplace_categories")
    .select("slug, name")
    .order("sort_order", { ascending: true })
    .limit(1)
    .maybeSingle(),
  supabase
    .from("marketplace_products")
    .select("slug, title")
    .eq("approval_status", "approved")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle(),
  supabase
    .from("marketplace_vendors")
    .select("slug, name")
    .eq("status", "approved")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle(),
  supabase
    .from("marketplace_orders")
    .select("order_no")
    .order("placed_at", { ascending: false })
    .limit(1)
    .maybeSingle(),
]);

await checkRoute("/", "HenryCo Marketplace", "homepage");
await checkRoute("/search", "Reactive discovery", "search");
await checkRoute("/sell", "A selective marketplace for sellers", "sell page");
await checkRoute("/help", "Support flows designed to resolve edge cases", "help page");

if (category?.slug && category?.name) {
  await checkRoute(`/category/${category.slug}`, category.name, "category page");
} else {
  warnings.push("Skipped category route verification because no category row was available.");
}

if (product?.slug && product?.title) {
  await checkRoute(`/product/${product.slug}`, product.title, "product page");
} else {
  warnings.push("Skipped product route verification because no approved product row was available.");
}

if (vendor?.slug && vendor?.name) {
  await checkRoute(`/store/${vendor.slug}`, vendor.name, "store page");
} else {
  warnings.push("Skipped store route verification because no approved vendor row was available.");
}

if (order?.order_no) {
  await checkRoute(`/track/${order.order_no}`, order.order_no, "track page");
} else {
  warnings.push("Skipped track route verification because no live marketplace order was available.");
}

await assertSharedAccountRedirect(
  "/login?next=%2Faccount",
  "https://account.henrycogroup.com/login?next=",
  "/login"
);

await assertSharedAccountRedirect(
  "/signup?next=%2Faccount",
  "https://account.henrycogroup.com/signup?next=",
  "/signup"
);

await assertSharedAccountRedirect(
  "/admin",
  "https://account.henrycogroup.com/login?next=",
  "/admin"
);

{
  const shellResponse = await fetch(toUrl("/api/shell"), { redirect: "manual" });
  const shellPayload = await shellResponse.json();
  assert(shellResponse.ok, `/api/shell returned ${shellResponse.status}`);
  assert(Boolean(shellPayload?.schemaReady), "/api/shell did not report schemaReady=true");
}

{
  const healthResponse = await fetch(toUrl("/api/health"), { redirect: "manual" });
  const healthPayload = await healthResponse.json();
  assert(healthResponse.ok, `/api/health returned ${healthResponse.status}`);
  assert(Boolean(healthPayload?.ok), "/api/health did not report ok=true");
}

{
  const readinessResponse = await fetch(toUrl("/api/readiness"), { redirect: "manual" });
  const readinessPayload = await readinessResponse.json();
  assert(readinessResponse.ok, `/api/readiness returned ${readinessResponse.status}`);
  assert(Boolean(readinessPayload?.ready), "/api/readiness did not report ready=true");
}

{
  const versionResponse = await fetch(toUrl("/api/version"), { redirect: "manual" });
  const versionPayload = await versionResponse.json();
  assert(versionResponse.ok, `/api/version returned ${versionResponse.status}`);
  assert(Boolean(versionPayload?.app), "/api/version did not report app metadata");
}

{
  const productsResponse = await fetch(toUrl("/api/products"), { redirect: "manual" });
  const productsPayload = await productsResponse.json();
  assert(productsResponse.ok, `/api/products returned ${productsResponse.status}`);
  assert(Number(productsPayload?.total || 0) > 0, "/api/products returned no approved products");
}

if (product?.slug) {
  const sessionToken = randomUUID();
  const cookieHeader = `marketplace_cart_token=${sessionToken}`;
  const addResponse = await fetch(toUrl("/api/cart"), {
    method: "POST",
    redirect: "manual",
    headers: {
      "content-type": "application/json",
      cookie: cookieHeader,
    },
    body: JSON.stringify({
      productSlug: product.slug,
      quantity: 1,
      sessionToken,
    }),
  });
  const addPayload = await addResponse.json();
  const persistedCookie = extractCookie(addResponse) || cookieHeader;
  assert(addResponse.ok, `/api/cart POST returned ${addResponse.status}`);
  assert(
    Number(addPayload?.shell?.cart?.count || 0) > 0,
    "/api/cart POST did not return a non-empty cart shell"
  );

  const cartResponse = await fetch(toUrl("/api/cart"), {
    headers: {
      cookie: persistedCookie,
    },
    redirect: "manual",
  });
  const cartPayload = await cartResponse.json();
  assert(cartResponse.ok, `/api/cart GET returned ${cartResponse.status}`);
  assert(Number(cartPayload?.count || 0) > 0, "/api/cart GET did not persist the guest cart");

  const { response: checkoutResponse, body: checkoutBody } = await fetchText("/checkout", {
    headers: {
      cookie: persistedCookie,
    },
  });
  assert(checkoutResponse.ok, `/checkout returned ${checkoutResponse.status}`);
  assert(
    checkoutBody.includes("Sign in required") &&
      checkoutBody.includes("Sign in to continue"),
    "/checkout did not render the shared-account gate for a guest cart"
  );

  const addedItem = addPayload?.shell?.cart?.items?.find((item) => item.productSlug === product.slug);
  if (addedItem?.id) {
    const deleteResponse = await fetch(toUrl("/api/cart"), {
      method: "DELETE",
      redirect: "manual",
      headers: {
        "content-type": "application/json",
        cookie: persistedCookie,
      },
      body: JSON.stringify({ itemId: addedItem.id }),
    });
    assert(deleteResponse.ok, `/api/cart DELETE cleanup returned ${deleteResponse.status}`);
  } else {
    warnings.push("Guest cart cleanup skipped because the added cart item id was not returned.");
  }
}

for (const warning of warnings) {
  console.warn(`[marketplace:smoke] ${warning}`);
}

process.exit(hasFailure ? 1 : 0);
