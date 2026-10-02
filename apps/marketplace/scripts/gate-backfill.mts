/**
 * V3-MKT-TRUST-01 — the HELD backfill. A day-of step in the activation runbook
 * (docs/v3/marketplace-trust/ACTIVATION.md). It is never run by a deploy.
 *
 * Two passes, both through the same gate the seller's Publish button uses:
 *
 *   1. FINGERPRINTS — every first-party picture already attached to a listing is
 *      registered, oldest first, under the store that carries it. This must run
 *      BEFORE instant publish is switched on: "who had this picture first" is
 *      decided by registration order, so the existing catalogue has to be on
 *      record before anyone can upload a copy of it.
 *
 *   2. PENDING LISTINGS — every listing currently waiting in the review queue is
 *      re-run through the gate. A clean one goes live (the database guard checks
 *      its verdict like any other); one the gate holds stays in the queue with
 *      its reason codes; one the gate refuses is left exactly as it is for a
 *      person. Nothing is deleted and nothing is rejected by this script.
 *
 * DRY RUN BY DEFAULT. Without --apply it registers nothing, records nothing and
 * changes no listing: it prints what it would do.
 *
 * Usage (from apps/marketplace):
 *   pnpm gate:backfill -- --actor <staff user id>
 *   pnpm gate:backfill -- --actor <staff user id> --apply
 *
 *   --actor <uuid>         REQUIRED. A marketplace owner/admin account. The
 *                          database checks it may act for each store; the
 *                          decision is recorded under this id.
 *   --apply                actually do it.
 *   --limit <n>            pending listings per run (default 200).
 *   --only fingerprints|pending   run one pass.
 *
 * Environment: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (read from
 * .env.local when present). The script prints the project it is pointed at
 * before doing anything.
 */
import fs from "node:fs";
import path from "node:path";

function loadEnvFile(filepath: string) {
  if (!fs.existsSync(filepath)) return;
  for (const line of fs.readFileSync(filepath, "utf8").split(/\r?\n/)) {
    if (!line || line.trim().startsWith("#")) continue;
    const index = line.indexOf("=");
    if (index <= 0) continue;
    const key = line.slice(0, index).trim();
    const raw = line.slice(index + 1).trim();
    if (!key || process.env[key]) continue;
    process.env[key] = raw.replace(/^['"]|['"]$/g, "");
  }
}

function option(name: string): string | null {
  const args = process.argv.slice(2);
  const index = args.indexOf(`--${name}`);
  if (index < 0) return null;
  const value = args[index + 1];
  return value && !value.startsWith("--") ? value : "";
}
const has = (name: string) => process.argv.slice(2).includes(`--${name}`);

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PAGE = 500;

async function main() {
  loadEnvFile(path.resolve(process.cwd(), ".env.local"));
  loadEnvFile(path.resolve(process.cwd(), "..", "..", ".env.local"));

  const actor = option("actor") ?? "";
  const apply = has("apply");
  const only = option("only");
  const limit = Math.max(1, Math.min(2000, Number(option("limit") ?? 200) || 200));

  if (!UUID.test(actor)) {
    console.error("gate-backfill: --actor <staff user id> is required (a marketplace owner or admin account).");
    process.exit(2);
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  if (!url || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error("gate-backfill: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.");
    process.exit(2);
  }

  // The gate modules read the environment when they load: import them only now.
  const { createAdminSupabase } = await import("../lib/supabase");
  const { MARKETPLACE_IMAGE_BUCKET } = await import("../lib/marketplace/media-image");
  const { classifyImage, storageKeyOf } = await import("../lib/marketplace/publish-gate/image-refs");
  const { perceptualHashAvailable } = await import("../lib/marketplace/publish-gate/image-fingerprint");
  const { instantListingUpsert } = await import("../lib/marketplace/publish-gate/listing-write");
  const { isMissingRpc, registerUploadedImage, runListingGate } = await import("../lib/marketplace/publish-gate/server");

  const admin = createAdminSupabase();
  console.log(`gate-backfill → ${new URL(url).host}   mode: ${apply ? "APPLY" : "dry run"}   actor: ${actor}`);

  // ---- preflight ------------------------------------------------------------
  const probe = await admin.rpc("marketplace_gate_probation_caps");
  if (probe.error) {
    console.error(
      isMissingRpc(probe.error)
        ? "gate-backfill: the trust migration is not applied on this database (or the API schema cache has not reloaded). Nothing done."
        : `gate-backfill: the gate is not reachable (${probe.error.code ?? "error"}). Nothing done.`,
    );
    process.exit(1);
  }
  const decoder = await perceptualHashAvailable();
  console.log(`perceptual image hash: ${decoder ? "available" : "NOT available — byte-identical matching only"}`);

  const summary = {
    fingerprints: { seen: 0, alreadyRegistered: 0, registered: 0, wouldRegister: 0, notFirstParty: 0, failed: 0 },
    pending: { seen: 0, publish: 0, hold: 0, reject: 0, skipped: 0, failed: 0 },
  };

  // ---- pass 1: fingerprints ---------------------------------------------------
  if (only !== "pending") {
    const vendorOfProduct = new Map<string, string | null>();
    for (let from = 0; ; from += PAGE) {
      const { data, error } = await admin
        .from("marketplace_product_media")
        .select("id, product_id, url, created_at")
        .eq("kind", "image")
        .order("created_at", { ascending: true })
        .range(from, from + PAGE - 1);
      if (error) throw new Error(`media read failed: ${error.message}`);
      const rows = (data ?? []) as Array<{ product_id: string; url: string }>;
      if (rows.length === 0) break;

      const unknownProducts = Array.from(new Set(rows.map((row) => String(row.product_id)))).filter(
        (id) => !vendorOfProduct.has(id),
      );
      if (unknownProducts.length > 0) {
        const { data: products } = await admin.from("marketplace_products").select("id, vendor_id").in("id", unknownProducts);
        for (const product of (products ?? []) as Array<{ id: string; vendor_id: string | null }>) {
          vendorOfProduct.set(String(product.id), product.vendor_id);
        }
      }

      const candidates: Array<{ ref: string; key: string; uploader: string | null; vendorId: string | null }> = [];
      for (const row of rows) {
        summary.fingerprints.seen += 1;
        const image = classifyImage(row.url, url);
        const key = image.ref ? storageKeyOf(image.ref) : null;
        if (!image.ref || !key) {
          summary.fingerprints.notFirstParty += 1;
          continue;
        }
        candidates.push({ ref: image.ref, key, uploader: image.uploaderId, vendorId: vendorOfProduct.get(String(row.product_id)) ?? null });
      }

      const registered = new Set<string>();
      for (let index = 0; index < candidates.length; index += 100) {
        const refs = candidates.slice(index, index + 100).map((candidate) => candidate.ref);
        const { data: known } = await admin.from("marketplace_image_fingerprints").select("ref").in("ref", refs);
        for (const row of (known ?? []) as Array<{ ref: string }>) registered.add(row.ref);
      }

      for (const candidate of candidates) {
        if (registered.has(candidate.ref)) {
          summary.fingerprints.alreadyRegistered += 1;
          continue;
        }
        registered.add(candidate.ref);
        if (!apply) {
          summary.fingerprints.wouldRegister += 1;
          continue;
        }
        try {
          const download = await admin.storage.from(MARKETPLACE_IMAGE_BUCKET).download(candidate.key);
          if (download.error || !download.data) {
            summary.fingerprints.failed += 1;
            continue;
          }
          const ok = await registerUploadedImage(admin, {
            ref: candidate.ref,
            bytes: new Uint8Array(await download.data.arrayBuffer()),
            uploaderId: candidate.uploader,
            vendorId: candidate.vendorId,
          });
          if (ok) summary.fingerprints.registered += 1;
          else summary.fingerprints.failed += 1;
        } catch {
          summary.fingerprints.failed += 1;
        }
      }
      if (rows.length < PAGE) break;
    }
    console.log("fingerprints:", JSON.stringify(summary.fingerprints));
  }

  // ---- pass 2: pending listings -------------------------------------------------
  if (only !== "fingerprints") {
    const { data: categories } = await admin.from("marketplace_categories").select("id, slug");
    const categorySlug = new Map(
      ((categories ?? []) as Array<{ id: string; slug: string }>).map((row) => [String(row.id), String(row.slug)]),
    );

    const { data: pending, error } = await admin
      .from("marketplace_products")
      .select(
        "id, slug, vendor_id, category_id, brand_id, title, summary, description, base_price, compare_at_price, sku, delivery_note, lead_time, cod_eligible, specifications, filter_data, total_stock, currency, approval_status, inventory_owner_type",
      )
      .in("approval_status", ["submitted", "under_review"])
      .order("created_at", { ascending: true })
      .limit(limit);
    if (error) throw new Error(`pending read failed: ${error.message}`);

    for (const product of (pending ?? []) as Array<Record<string, unknown>>) {
      summary.pending.seen += 1;
      const slug = String(product.slug ?? "");
      const vendorId = product.vendor_id ? String(product.vendor_id) : null;
      if (!vendorId || product.inventory_owner_type === "company") {
        summary.pending.skipped += 1;
        console.log(`  skip    ${slug}  (company catalogue or no store)`);
        continue;
      }
      const specifications = (product.specifications ?? {}) as Record<string, unknown>;
      const filterData = (product.filter_data ?? {}) as Record<string, unknown>;
      const draft = {
        slug,
        categoryId: String(product.category_id ?? ""),
        categorySlug: categorySlug.get(String(product.category_id ?? "")) ?? "",
        brandId: product.brand_id ? String(product.brand_id) : null,
        title: String(product.title ?? ""),
        summary: String(product.summary ?? ""),
        description: String(product.description ?? ""),
        basePrice: Number(product.base_price ?? 0),
        compareAtPrice: product.compare_at_price == null ? null : Number(product.compare_at_price),
        sku: String(product.sku ?? ""),
        deliveryNote: String(product.delivery_note ?? ""),
        leadTime: String(product.lead_time ?? ""),
        codEligible: product.cod_eligible === true,
        material: typeof specifications.Material === "string" ? specifications.Material : "",
        warranty: typeof specifications.Warranty === "string" ? specifications.Warranty : "",
        requestFeaturedPlacement: filterData.requestFeaturedPlacement === true,
      };

      try {
        if (!apply) {
          const { data: media } = await admin
            .from("marketplace_product_media")
            .select("url")
            .eq("product_id", String(product.id))
            .eq("kind", "image")
            .order("sort_order", { ascending: true });
          const existingMedia = ((media ?? []) as Array<{ url: string }>).map((row) => row.url);
          const preview = await runListingGate(admin, {
            actorId: actor,
            vendorId,
            vendor: null,
            draft,
            postedImages: existingMedia,
            existingMedia,
            existingCurrency: typeof product.currency === "string" ? product.currency : null,
            openDisputeCount: 0,
            locale: "en",
            publicBaseUrl: url,
            source: "backfill",
            dryRun: true,
          });
          summary.pending[preview.verdict.outcome] += 1;
          console.log(`  ${preview.verdict.outcome.padEnd(7)} ${slug}  ${preview.verdict.reasons.join(", ")}`);
          continue;
        }

        const result = await instantListingUpsert({
          admin,
          actorId: actor,
          vendorId,
          vendor: null,
          draft,
          stock: Number(product.total_stock ?? 0),
          postedImages: [],
          onHold: "keep",
          locale: "en",
          publicBaseUrl: url,
          source: "backfill",
        });
        if (result.kind === "done") {
          summary.pending[result.outcome] += 1;
          console.log(`  ${result.outcome.padEnd(7)} ${slug}  ${result.reasons.join(", ")}`);
        } else {
          summary.pending.failed += 1;
          console.log(`  failed  ${slug}  (${result.kind === "forbidden" ? "the actor may not act for this store" : "gate not installed"})`);
          if (result.kind === "forbidden") {
            console.error("gate-backfill: --actor must be a marketplace owner or admin. Stopping.");
            break;
          }
        }
      } catch (cause) {
        summary.pending.failed += 1;
        console.log(`  failed  ${slug}  (${cause instanceof Error ? cause.message : "error"})`);
      }
    }
    console.log("pending:", JSON.stringify(summary.pending));
  }

  console.log(apply ? "done." : "dry run complete — nothing was changed. Re-run with --apply to do it.");
}

main().catch((cause) => {
  console.error("gate-backfill failed:", cause instanceof Error ? cause.message : cause);
  process.exit(1);
});
