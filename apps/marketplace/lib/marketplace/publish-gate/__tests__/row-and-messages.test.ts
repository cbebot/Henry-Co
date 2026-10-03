// V3-MKT-TRUST-01 — the row a verdict is bound to, the words a seller reads, and
// the picture fingerprint. Pure tests; no database.

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";

import { getMarketplaceTrustCopy, type AppLocale } from "@henryco/i18n/server";
import {
  MIN_STRONG_CELLS,
  fingerprintImageBytes,
  perceptualDistance,
  perceptualHashOfGrid,
} from "../image-fingerprint";
import { buildListingRow, mediaDigest, readStoredGate, withGateBlock, type ListingDraft } from "../listing-row";
import { describeReasons, gateNotice } from "../messages";
import { ALL_GATE_REASONS, GATE_ENGINE_VERSION, reasonClass } from "../reasons";
import type { ProbationCaps } from "../seller-state";

const MIGRATION = readFileSync(
  join(process.cwd(), "supabase/migrations/20261002120000_v3_mkt_trust_01_instant_publish.sql"),
  "utf8",
);

const REF_A = "media://public/marketplace-images/product/11111111-1111-4111-8111-111111111111/a.jpg";
const REF_B = "media://public/marketplace-images/product/11111111-1111-4111-8111-111111111111/b.jpg";

const CAPS: ProbationCaps = {
  maxLiveListings: 10,
  maxNewListingsPerDay: 5,
  maxPrice: 500_000,
  graduationMinDeliveredOrders: 3,
  graduationMinDays: 14,
};

function draft(overrides: Partial<ListingDraft> = {}): ListingDraft {
  return {
    slug: "steel-kettle",
    categoryId: "c1",
    categorySlug: "home-kitchen",
    brandId: null,
    title: "Stainless steel electric kettle",
    summary: "A two litre kettle with auto shut-off, a concealed element and a one year warranty.",
    description:
      "Boils two litres in under four minutes. Brushed stainless body, cool-touch handle, removable limescale filter, " +
      "360 degree cordless base and boil-dry protection. Comes boxed with a one year replacement warranty.",
    basePrice: 18500,
    compareAtPrice: null,
    sku: "KET-2000",
    deliveryNote: "Dispatched within 24 hours, delivered in 2 to 4 days.",
    leadTime: "2-4 days",
    codEligible: true,
    material: "Stainless steel",
    warranty: "1 year",
    requestFeaturedPlacement: false,
    ...overrides,
  };
}

function row(overrides: Partial<Parameters<typeof buildListingRow>[0]> = {}) {
  return buildListingRow({
    draft: draft(),
    vendorId: "v1",
    vendor: null,
    refs: [REF_A],
    listingRows: 1,
    openDisputeCount: 0,
    duplicateImage: false,
    outcome: "publish",
    reasons: [],
    ...overrides,
  });
}

describe("the hashed row", () => {
  it("carries exactly the columns the database hashes", () => {
    // Read the column list out of marketplace_listing_content_hash(): if a column
    // is added to the hash and not to the row (or the reverse), the verdict the
    // gate records can never match the row it writes.
    const body = MIGRATION.slice(
      MIGRATION.indexOf("create or replace function public.marketplace_listing_content_hash"),
      MIGRATION.indexOf("-- 2. Tables."),
    );
    const hashed = [...body.matchAll(/^\s+'([a-z_]+)',\s+(?:coalesce|to_jsonb)\(/gm)].map((match) => match[1]).sort();
    assert.ok(hashed.length >= 18, `expected to parse the hash columns, got ${hashed.length}`);
    const written = Object.keys(row({ currency: "NGN" })).sort();
    assert.deepEqual(written, hashed);
  });

  it("omits currency for a new listing and keeps an existing one", () => {
    assert.equal("currency" in row(), false);
    assert.equal(row({ currency: "USD" }).currency, "USD");
    assert.equal("currency" in row({ currency: "  " }), false);
  });

  it("is deterministic: the same input gives the same object", () => {
    assert.deepEqual(row(), row());
  });

  it("a gallery change is a content change", () => {
    const one = row({ refs: [REF_A] });
    const two = row({ refs: [REF_A, REF_B] });
    const swapped = row({ refs: [REF_B, REF_A] });
    const gate = (r: ReturnType<typeof row>) => (r.filter_data.gate as { media: string }).media;
    assert.notEqual(gate(one), gate(two));
    assert.notEqual(gate(two), gate(swapped));
    assert.equal(mediaDigest([REF_A, REF_B]), mediaDigest([REF_A, REF_B]));
  });

  it("does not put the legacy review-queue badges in front of buyers", () => {
    const thin = row({ draft: draft({ sku: "", deliveryNote: "", leadTime: "" }) });
    assert.ok(!thin.trust_badges.includes("Listing review required"));
    assert.ok(!thin.trust_badges.includes("Risk review"));
  });

  it("stamps the engine version and only the blocking reasons", () => {
    const held = row({ outcome: "hold", reasons: ["restricted_item_review", "thin_listing"] });
    assert.deepEqual(readStoredGate(held.filter_data), { outcome: "hold", reasons: ["restricted_item_review"] });
    assert.equal((held.filter_data.gate as { engine: string }).engine, GATE_ENGINE_VERSION);
  });

  it("withGateBlock restates the outcome and leaves the rest alone", () => {
    const published = row();
    const corrected = withGateBlock(published.filter_data, "reject", ["probation_daily_cap"]);
    assert.deepEqual(readStoredGate(corrected), { outcome: "reject", reasons: ["probation_daily_cap"] });
    assert.equal((corrected.gate as { media: string }).media, (published.filter_data.gate as { media: string }).media);
    assert.equal(corrected.qualityScore, published.filter_data.qualityScore);
  });

  it("readStoredGate tolerates rows written before the gate existed", () => {
    for (const value of [null, undefined, "x", [], {}, { gate: null }, { gate: [] }, { gate: { outcome: "live" } }]) {
      assert.deepEqual(readStoredGate(value), { outcome: null, reasons: [] });
    }
  });
});

const LOCALES: AppLocale[] = ["en", "fr", "es", "pt", "de", "it", "ar", "zh", "ig", "yo", "ha", "hi"];

describe("every reason code can be said to a seller", () => {
  it("the copy covers exactly the gate's vocabulary", () => {
    const copy = getMarketplaceTrustCopy("en");
    assert.deepEqual(Object.keys(copy.reasons).sort(), [...ALL_GATE_REASONS].sort());
  });

  for (const locale of LOCALES) {
    it(`${locale}: every code has a label and a next step, with no placeholder left unfilled`, () => {
      const described = describeReasons({ reasons: ALL_GATE_REASONS, caps: CAPS, locale, includeSignals: true });
      assert.equal(described.length, ALL_GATE_REASONS.length);
      for (const entry of described) {
        assert.ok(entry.label.trim().length > 0, entry.code);
        assert.ok(entry.fix.trim().length > 0, entry.code);
        assert.ok(!/\{[a-z]+\}/i.test(entry.label + entry.fix), `${locale} ${entry.code}: ${entry.label} / ${entry.fix}`);
      }
    });
  }

  it("the untranslated locales fall back to English, never to a blank", () => {
    const english = getMarketplaceTrustCopy("en");
    for (const locale of ["ig", "yo", "ha", "hi"] as AppLocale[]) {
      assert.equal(getMarketplaceTrustCopy(locale).result.publishedTitle, english.result.publishedTitle);
    }
  });

  it("fills the store's real limits into the probation reasons", () => {
    const [listing, daily, price] = describeReasons({
      reasons: ["probation_listing_cap", "probation_daily_cap", "probation_price_cap"],
      caps: CAPS,
      locale: "en",
    });
    assert.match(listing.fix, /\b10\b/);
    assert.match(daily.fix, /\b5\b/);
    assert.match(price.fix, /500,000/);
  });

  it("drops codes it does not know rather than echoing them", () => {
    const described = describeReasons({ reasons: ["<script>", "contact_details", "made_up_code"], caps: null, locale: "en" });
    assert.deepEqual(described.map((entry) => entry.code), ["contact_details"]);
  });

  it("signals are advice: they are not listed as problems unless asked for", () => {
    const signals = ALL_GATE_REASONS.filter((code) => reasonClass(code) === "signal");
    assert.deepEqual(describeReasons({ reasons: signals, caps: null, locale: "en" }), []);
    assert.equal(describeReasons({ reasons: signals, caps: null, locale: "en", includeSignals: true }).length, signals.length);
  });
});

describe("the notice a seller sees", () => {
  it("publish: live, or changes live", () => {
    const fresh = gateNotice({ locale: "en", outcome: "publish", reasons: [], liveEdit: false, caps: null });
    const edit = gateNotice({ locale: "en", outcome: "publish", reasons: [], liveEdit: true, caps: null });
    assert.equal(fresh.tone, "success");
    assert.equal(edit.tone, "success");
    assert.notEqual(fresh.title, edit.title);
  });

  it("hold: names what is being checked", () => {
    const notice = gateNotice({ locale: "en", outcome: "hold", reasons: ["restricted_item_review"], liveEdit: false, caps: null });
    assert.equal(notice.tone, "info");
    assert.match(notice.body, /Restricted item check/);
    assert.ok(!notice.body.includes("{reasons}"));
  });

  it("reject: names what to change, once, with no doubled full stop", () => {
    const notice = gateNotice({
      locale: "en",
      outcome: "reject",
      reasons: ["contact_details", "price_invalid"],
      liveEdit: false,
      caps: null,
    });
    assert.equal(notice.tone, "error");
    assert.match(notice.body, /Remove phone numbers/);
    assert.match(notice.body, /whole-number price/);
    assert.ok(!notice.body.includes(".."), notice.body);
    assert.ok(!/\{[a-z]+\}/.test(notice.body), notice.body);
  });

  it("a refused or held edit of a live listing says the live version is unchanged", () => {
    const copy = getMarketplaceTrustCopy("en");
    for (const outcome of ["hold", "reject"] as const) {
      const notice = gateNotice({
        locale: "en",
        outcome,
        reasons: ["contact_details", "restricted_item_review"],
        liveEdit: true,
        keptLive: true,
        caps: null,
      });
      assert.equal(notice.title, copy.result.keptLiveTitle);
      assert.equal(notice.tone, "error");
    }
  });

  it("never claims a brand name other than the configured one", () => {
    const [entry] = describeReasons({ reasons: ["contact_details"], caps: null, locale: "en" });
    assert.match(entry.fix, /Henry Onyx messages/);
    assert.ok(!/HenryCo/.test(entry.fix));
  });
});

describe("the picture fingerprint", () => {
  function grid(fill: (row: number, col: number) => number): Uint8Array {
    const pixels = new Uint8Array(72);
    for (let r = 0; r < 8; r += 1) for (let c = 0; c < 9; c += 1) pixels[r * 9 + c] = fill(r, c);
    return pixels;
  }
  const structured = (r: number, c: number) => (c * 37 + r * 91 + ((r * c) % 5) * 40) % 256;

  it("a flat picture has no perceptual hash", () => {
    assert.equal(perceptualHashOfGrid(grid(() => 255)), null);
    assert.equal(perceptualHashOfGrid(grid((_r, c) => 250 + (c % 2))), null);
  });

  it("a picture with too few structured cells has no perceptual hash", () => {
    // One bright column: 16 non-flat cells, below the bar.
    const hash = perceptualHashOfGrid(grid((_r, c) => (c === 4 ? 0 : 255)));
    assert.ok(MIN_STRONG_CELLS > 16);
    assert.equal(hash, null);
  });

  it("a structured picture hashes, and a mirror image hashes to the same value", () => {
    const plain = perceptualHashOfGrid(grid(structured));
    const mirrored = perceptualHashOfGrid(grid((r, c) => structured(r, 8 - c)));
    assert.ok(plain);
    assert.deepEqual(mirrored, plain);
    assert.equal(perceptualDistance(plain!, mirrored!), 0);
  });

  it("small noise in flat areas does not move the hash; a different picture is far away", () => {
    const base = perceptualHashOfGrid(grid(structured))!;
    const noisy = perceptualHashOfGrid(grid((r, c) => Math.min(255, structured(r, c) + ((r + c) % 2))))!;
    const other = perceptualHashOfGrid(grid((r, c) => (c * 91 + r * 37 + ((r + c) % 7) * 30) % 256))!;
    assert.ok(perceptualDistance(base, noisy) <= 4, String(perceptualDistance(base, noisy)));
    assert.ok(perceptualDistance(base, other) > 16, String(perceptualDistance(base, other)));
  });

  it("the two masks never claim the same cell", () => {
    const hash = perceptualHashOfGrid(grid(structured))!;
    assert.equal(BigInt.asUintN(64, BigInt(hash.pos)) & BigInt.asUintN(64, BigInt(hash.neg)), BigInt(0));
  });

  it("bytes always get a sha256; nothing gets a fingerprint from an empty or oversized input", async () => {
    assert.equal(await fingerprintImageBytes(new Uint8Array(0)), null);
    assert.equal(await fingerprintImageBytes(new Uint8Array(13 * 1024 * 1024)), null);
    const junk = await fingerprintImageBytes(new Uint8Array([1, 2, 3, 4, 5]));
    assert.ok(junk);
    assert.match(junk!.sha256, /^[0-9a-f]{64}$/);
    assert.equal(junk!.phash, null); // not a picture: byte hash only
  });
});
