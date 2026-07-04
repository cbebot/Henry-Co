import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { isUuid, relationalListingKind, relationalListingStatus, rowToListing, stableListingRowId } from "./listing-mapping";
import type { PropertyListing } from "./types";

// A representative slice of the rich PropertyListing shape (nested feeBreakdown + arrays) — the
// mapping is a spread, so preserving these proves the whole object round-trips through `data`.
const sample = {
  id: "l1",
  slug: "a-listing",
  title: "A Listing",
  summary: "s",
  description: "d",
  gallery: ["media://x"],
  amenities: ["Parking", "Water"],
  trustBadges: ["Owner verified"],
  feeBreakdown: { currency: "NGN", lines: [{ code: "rent", label: "Rent", amount: 1000 }], total: 1000 },
  managedByHenryCo: false,
  status: "published",
  visibility: "public",
} as unknown as PropertyListing;

describe("property DB row → PropertyListing mapping (Stage 1)", () => {
  it("round-trips the full listing object from `data` and overlays the badge", () => {
    const out = rowToListing({ data: sample, henry_onyx_verified: true });
    assert.ok(out);
    assert.equal(out.id, "l1");
    assert.equal(out.slug, "a-listing");
    assert.deepEqual(out.gallery, ["media://x"]);
    assert.deepEqual(out.amenities, ["Parking", "Water"]);
    assert.deepEqual(out.feeBreakdown, sample.feeBreakdown); // nested shape preserved
    assert.equal(out.henryOnyxVerified, true); // badge overlaid from the relational column
  });

  it("overlays henryOnyxVerified from the relational column — never a data-embedded flag (anti-forgery)", () => {
    const spoofed = { ...(sample as object), henryOnyxVerified: true } as unknown as PropertyListing;
    assert.equal(rowToListing({ data: spoofed, henry_onyx_verified: false })?.henryOnyxVerified, false);
    assert.equal(rowToListing({ data: spoofed, henry_onyx_verified: null })?.henryOnyxVerified, false);
  });

  it("returns null for a row without a usable data object", () => {
    assert.equal(rowToListing({ data: null, henry_onyx_verified: true }), null);
    assert.equal(rowToListing({ data: [], henry_onyx_verified: true }), null);
    assert.equal(rowToListing({ data: "nope", henry_onyx_verified: true }), null);
  });
});

describe("stableListingRowId — deterministic row ids for uuid columns", () => {

  it("passes real uuids through unchanged", () => {
    const real = "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d";
    assert.equal(stableListingRowId(real), real);
  });

  it("maps a legacy string id to a stable, valid uuid — same input, same uuid, every time", () => {
    const a1 = stableListingRowId("listing-ikoyi-apartment");
    const a2 = stableListingRowId("listing-ikoyi-apartment");
    assert.equal(a1, a2);
    assert.ok(isUuid(a1), `derived id must be a uuid, got ${a1}`);
  });

  it("distinct legacy ids map to distinct uuids", () => {
    assert.notEqual(stableListingRowId("listing-ikoyi-apartment"), stableListingRowId("listing-lekki-duplex"));
  });

  it("isUuid rejects legacy ids and junk", () => {
    assert.equal(isUuid("agent-adaeze"), false);
    assert.equal(isUuid(""), false);
    assert.equal(isUuid(null), false);
    assert.equal(isUuid(undefined), false);
    assert.equal(isUuid("a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d"), true);
  });
});

describe("relational vocabulary translators — live check constraints vs app unions", () => {
  it("maps every app status into the DB's allowed set", () => {
    const allowed = new Set(["draft", "submitted", "changes_requested", "approved", "rejected", "archived"]);
    const appStatuses = [
      "draft", "submitted", "awaiting_documents", "awaiting_eligibility", "inspection_requested",
      "inspection_scheduled", "under_review", "requires_correction", "verified", "published",
      "changes_requested", "approved", "rejected", "blocked", "escalated", "archived",
    ] as const;
    for (const status of appStatuses) {
      assert.ok(allowed.has(relationalListingStatus(status)), `${status} must map into the allowed set`);
    }
    assert.equal(relationalListingStatus("published"), "approved");
    assert.equal(relationalListingStatus("blocked"), "rejected");
    assert.equal(relationalListingStatus("requires_correction"), "changes_requested");
    assert.equal(relationalListingStatus("under_review"), "submitted");
  });

  it("maps kind: land joins the sale class; the DB's own values pass through", () => {
    assert.equal(relationalListingKind("land"), "sale");
    for (const kind of ["rent", "sale", "commercial", "managed", "shortlet"] as const) {
      assert.equal(relationalListingKind(kind), kind);
    }
  });
});
